import type {
  LanguageModelV3Middleware,
  LanguageModelV3StreamPart,
} from '@ai-sdk/provider';
import {
  MERGE_TOOLS,
  TOOL_TAG_OPEN_RE,
  TOOL_TAG_PAIR_RE,
} from './fn-call-middleware/constants';
import {
  deduplicateContentToolCalls,
  deduplicateToolCalls,
} from './fn-call-middleware/dedup';
import {
  parseFnCallLine,
  parseToolCallJson,
} from './fn-call-middleware/parsers';
import type { ToolCall } from './fn-call-middleware/types';

/**
 * Middleware that intercepts text-based tool call formats from models that
 * don't support OpenAI-native function calling, and converts them into
 * proper tool-call stream events.
 *
 * Supported formats:
 *   1. <tool_call>{"name":"toolName","arguments":{"key":"value"}}</tool_call>
 *
 *   2. FN_CALL=True
 *      toolName(key="value", key2=123, key3={"nested": "json"})
 */
export function extractFnCallMiddleware(): LanguageModelV3Middleware {
  const createToolCallId = () => `fn-${crypto.randomUUID()}`;

  return {
    specificationVersion: 'v3',

    wrapGenerate: async ({ doGenerate }) => {
      const result = await doGenerate();
      const transformedContent: typeof result.content = [];
      let hasToolCalls = false;

      for (const part of result.content) {
        if (part.type !== 'text') {
          // Suppress native tool-call parts — we extract our own from text
          if (part.type === 'tool-call') continue;
          transformedContent.push(part);
          continue;
        }

        const fnCallIdx = part.text.indexOf('FN_CALL=True');
        if (fnCallIdx === -1) {
          // Canonical tagged JSON format: <tool_call>...</tool_call>
          TOOL_TAG_PAIR_RE.lastIndex = 0;
          let lastIdx = 0;
          let match;
          let foundTags = false;
          while ((match = TOOL_TAG_PAIR_RE.exec(part.text)) !== null) {
            const before = part.text.substring(lastIdx, match.index).trim();
            if (before) {
              transformedContent.push({ type: 'text', text: before });
            }
            const parsed = parseToolCallJson(match[2].trim());
            if (parsed) {
              transformedContent.push({
                type: 'tool-call',
                toolCallId: createToolCallId(),
                toolName: parsed.name,
                input: JSON.stringify(parsed.arguments || {}),
              });
              hasToolCalls = true;
            } else {
              // Preserve malformed tagged calls as text to avoid silent loss.
              transformedContent.push({ type: 'text', text: match[0] });
            }
            foundTags = true;
            lastIdx = match.index + match[0].length;
          }
          if (foundTags) {
            const remaining = part.text.substring(lastIdx).trim();
            if (remaining) {
              transformedContent.push({ type: 'text', text: remaining });
            }
          } else {
            transformedContent.push(part);
          }
          continue;
        }

        const before = part.text.substring(0, fnCallIdx).trim();
        if (before) {
          transformedContent.push({ type: 'text', text: before });
        }

        const after = part.text.substring(fnCallIdx + 'FN_CALL=True'.length);
        for (const line of after.split('\n')) {
          const parsed = parseFnCallLine(line.trim());
          if (parsed) {
            transformedContent.push({
              type: 'tool-call',
              toolCallId: createToolCallId(),
              toolName: parsed.toolName,
              input: JSON.stringify(parsed.args),
            });
            hasToolCalls = true;
          }
        }
      }

      return {
        ...result,
        content: deduplicateContentToolCalls(transformedContent),
        finishReason: hasToolCalls
          ? { unified: 'tool-calls' as const, raw: 'tool-calls' }
          : result.finishReason,
      };
    },

    wrapStream: async ({ doStream }) => {
      const { stream, ...rest } = await doStream();

      let fnCallMode = false;
      let lineBuffer = '';
      let textId: string | null = null;
      let delayedTextStart: LanguageModelV3StreamPart | null = null;
      let delayedTextEnd: LanguageModelV3StreamPart | null = null;
      let hasEmittedText = false;
      const toolCalls: ToolCall[] = [];

      // Native tool-call dedup state for merge tools
      const mergeToolIdToName = new Map<string, string>();
      const mergeToolFirstStreamId: Record<string, string> = {};
      const nativeMergeToolCalls: ToolCall[] = [];
      let toolCallTagMode = false;
      let toolCallTagBuffer = '';
      let toolCallTagName = '';

      function emitText(
        text: string,
        controller: TransformStreamDefaultController<LanguageModelV3StreamPart>
      ) {
        if (!text) return;
        if (delayedTextStart) {
          controller.enqueue(delayedTextStart);
          delayedTextStart = null;
        }
        controller.enqueue({
          type: 'text-delta',
          delta: text,
          id: textId!,
        });
        hasEmittedText = true;
      }

      function processLine(
        line: string,
        controller: TransformStreamDefaultController<LanguageModelV3StreamPart>
      ) {
        // Handle multi-line tag accumulation (e.g. <tool_call>...\n...</tool_call>)
        if (toolCallTagMode) {
          const closeTag = `</${toolCallTagName}>`;
          const endIdx = line.indexOf(closeTag);
          if (endIdx !== -1) {
            toolCallTagBuffer += line.substring(0, endIdx);
            const parsed = parseToolCallJson(toolCallTagBuffer.trim());
            if (parsed) {
              toolCalls.push({
                id: createToolCallId(),
                toolName: parsed.name,
                args: JSON.stringify(parsed.arguments || {}),
              });
            } else {
              emitText(
                `<${toolCallTagName}>${toolCallTagBuffer}${closeTag}`,
                controller
              );
            }
            // Emit any trailing content after the closing tag
            const trailing = line.substring(endIdx + closeTag.length).trim();
            if (trailing) {
              emitText(trailing + '\n', controller);
            }
            toolCallTagMode = false;
            toolCallTagBuffer = '';
            toolCallTagName = '';
          } else {
            toolCallTagBuffer += line + '\n';
          }
          return;
        }

        // Check for canonical tool-call tag on this line (<tool_call>).
        const tagMatch = line.match(TOOL_TAG_OPEN_RE);
        if (tagMatch) {
          const tagName = tagMatch[1];
          const tagStart = tagMatch.index!;
          const before = line.substring(0, tagStart);
          if (before.trim() && !fnCallMode) {
            emitText(before, controller);
          }
          const afterTag = line.substring(tagStart + tagMatch[0].length);
          const closeTag = `</${tagName}>`;
          const endIdx = afterTag.indexOf(closeTag);
          if (endIdx !== -1) {
            // Single-line tool call
            const parsed = parseToolCallJson(
              afterTag.substring(0, endIdx).trim()
            );
            if (parsed) {
              toolCalls.push({
                id: createToolCallId(),
                toolName: parsed.name,
                args: JSON.stringify(parsed.arguments || {}),
              });
            } else {
              emitText(
                `${tagMatch[0]}${afterTag.substring(0, endIdx)}${closeTag}`,
                controller
              );
            }
            // Emit any trailing content after the closing tag
            const trailing = afterTag
              .substring(endIdx + closeTag.length)
              .trim();
            if (trailing) {
              emitText(trailing + '\n', controller);
            }
          } else {
            // Multi-line — start accumulating
            toolCallTagMode = true;
            toolCallTagName = tagName;
            toolCallTagBuffer = afterTag + '\n';
          }
          return;
        }

        if (!fnCallMode) {
          if (line.trim().toUpperCase() === 'FN_CALL=TRUE') {
            fnCallMode = true;
          } else {
            emitText(line + '\n', controller);
          }
        } else {
          const trimmed = line.trim();
          if (trimmed) {
            const parsed = parseFnCallLine(trimmed);
            if (parsed) {
              toolCalls.push({
                id: createToolCallId(),
                toolName: parsed.toolName,
                args: JSON.stringify(parsed.args),
              });
            }
          }
        }
      }

      function flushBuffer(
        controller: TransformStreamDefaultController<LanguageModelV3StreamPart>
      ) {
        // Flush any in-progress tool-call tag
        if (toolCallTagMode) {
          toolCallTagBuffer += lineBuffer;
          lineBuffer = '';
          const closeTag = `</${toolCallTagName}>`;
          const endIdx = toolCallTagBuffer.indexOf(closeTag);
          const content =
            endIdx !== -1
              ? toolCallTagBuffer.substring(0, endIdx).trim()
              : toolCallTagBuffer.trim();
          if (content) {
            const parsed = parseToolCallJson(content);
            if (parsed) {
              toolCalls.push({
                id: createToolCallId(),
                toolName: parsed.name,
                args: JSON.stringify(parsed.arguments || {}),
              });
            } else if (content) {
              emitText(`<${toolCallTagName}>${content}${closeTag}`, controller);
            }
          }
          toolCallTagMode = false;
          toolCallTagBuffer = '';
          toolCallTagName = '';
          return;
        }

        if (!lineBuffer) return;

        // Check for tool-call tag in remaining buffer
        const bufTagMatch = lineBuffer.match(TOOL_TAG_OPEN_RE);
        if (bufTagMatch) {
          const tagName = bufTagMatch[1];
          const tagStart = bufTagMatch.index!;
          const before = lineBuffer.substring(0, tagStart).trim();
          if (before && !fnCallMode) {
            emitText(before, controller);
          }
          const afterTag = lineBuffer.substring(
            tagStart + bufTagMatch[0].length
          );
          const closeTag = `</${tagName}>`;
          const endIdx = afterTag.indexOf(closeTag);
          const content =
            endIdx !== -1
              ? afterTag.substring(0, endIdx).trim()
              : afterTag.trim();
          if (content) {
            const parsed = parseToolCallJson(content);
            if (parsed) {
              toolCalls.push({
                id: createToolCallId(),
                toolName: parsed.name,
                args: JSON.stringify(parsed.arguments || {}),
              });
            } else {
              emitText(`${bufTagMatch[0]}${content}${closeTag}`, controller);
            }
          }
          lineBuffer = '';
          return;
        }

        if (!fnCallMode) {
          // Check if remaining buffer is/starts with FN_CALL marker
          if (lineBuffer.trim().toUpperCase().startsWith('FN_CALL=TRUE')) {
            fnCallMode = true;
            const afterMarker = lineBuffer.substring(
              lineBuffer.toUpperCase().indexOf('FN_CALL=TRUE') +
                'FN_CALL=TRUE'.length
            );
            for (const l of afterMarker.split('\n')) {
              const parsed = parseFnCallLine(l.trim());
              if (parsed) {
                toolCalls.push({
                  id: createToolCallId(),
                  toolName: parsed.toolName,
                  args: JSON.stringify(parsed.args),
                });
              }
            }
          } else {
            emitText(lineBuffer, controller);
          }
        } else {
          const parsed = parseFnCallLine(lineBuffer.trim());
          if (parsed) {
            toolCalls.push({
              id: createToolCallId(),
              toolName: parsed.toolName,
              args: JSON.stringify(parsed.args),
            });
          }
        }
        lineBuffer = '';
      }

      function emitToolCalls(
        controller: TransformStreamDefaultController<LanguageModelV3StreamPart>
      ) {
        // Include native merge-tool calls in the dedup pool
        for (const ntc of nativeMergeToolCalls) {
          toolCalls.push(ntc);
        }

        const deduped = deduplicateToolCalls(toolCalls);
        for (const tc of deduped) {
          const streamedId =
            MERGE_TOOLS.has(tc.toolName) && mergeToolFirstStreamId[tc.toolName]
              ? mergeToolFirstStreamId[tc.toolName]
              : null;

          if (streamedId) {
            tc.id = streamedId;
            // Only emit tool-call — input events were already streamed
            controller.enqueue({
              type: 'tool-call',
              toolCallId: tc.id,
              toolName: tc.toolName,
              input: tc.args,
            });
          } else {
            controller.enqueue({
              type: 'tool-input-start',
              id: tc.id,
              toolName: tc.toolName,
            });
            controller.enqueue({
              type: 'tool-input-delta',
              id: tc.id,
              delta: tc.args,
            });
            controller.enqueue({
              type: 'tool-input-end',
              id: tc.id,
            });
            controller.enqueue({
              type: 'tool-call',
              toolCallId: tc.id,
              toolName: tc.toolName,
              input: tc.args,
            });
          }
        }
      }

      return {
        stream: stream.pipeThrough(
          new TransformStream<
            LanguageModelV3StreamPart,
            LanguageModelV3StreamPart
          >({
            transform(chunk, controller) {
              // Delay text-start so we can suppress it if all text is FN_CALL
              if (chunk.type === 'text-start') {
                delayedTextStart = chunk;
                return;
              }

              // Delay text-end until finish
              if (chunk.type === 'text-end') {
                delayedTextEnd = chunk;
                return;
              }

              if (chunk.type === 'finish') {
                flushBuffer(controller);

                // Emit text-end if we emitted any text
                if (delayedTextEnd && hasEmittedText) {
                  controller.enqueue(delayedTextEnd);
                }

                emitToolCalls(controller);

                controller.enqueue({
                  ...chunk,
                  finishReason:
                    toolCalls.length > 0
                      ? {
                          unified: 'tool-calls' as const,
                          raw: 'tool-calls',
                        }
                      : chunk.finishReason,
                });
                return;
              }

              // Intercept native tool events for merge-tools:
              // buffer all calls, only stream input for the first one.
              if (chunk.type === 'tool-input-start') {
                if (MERGE_TOOLS.has(chunk.toolName)) {
                  mergeToolIdToName.set(chunk.id, chunk.toolName);
                  if (!mergeToolFirstStreamId[chunk.toolName]) {
                    mergeToolFirstStreamId[chunk.toolName] = chunk.id;
                    controller.enqueue(chunk); // stream first for UI
                  }
                  return;
                }
                // Preserve non-merge native tool events to avoid dropping valid calls.
                controller.enqueue(chunk);
                return;
              }

              if (
                chunk.type === 'tool-input-delta' ||
                chunk.type === 'tool-input-end'
              ) {
                const toolName = mergeToolIdToName.get(chunk.id);
                if (toolName) {
                  // Only pass through events for the first streamed ID
                  if (chunk.id === mergeToolFirstStreamId[toolName]) {
                    controller.enqueue(chunk);
                  }
                  return;
                }
                // Preserve non-merge native tool events to avoid dropped execution.
                controller.enqueue(chunk);
                return;
              }

              if (chunk.type === 'tool-call') {
                if (MERGE_TOOLS.has(chunk.toolName)) {
                  nativeMergeToolCalls.push({
                    id: chunk.toolCallId,
                    toolName: chunk.toolName,
                    args:
                      typeof chunk.input === 'string'
                        ? chunk.input
                        : JSON.stringify(chunk.input),
                  });
                  return;
                }
                // Preserve non-merge native tool-call events.
                controller.enqueue(chunk);
                return;
              }

              // Only process text-delta; pass everything else through
              if (chunk.type !== 'text-delta') {
                controller.enqueue(chunk);
                return;
              }

              textId = chunk.id;
              lineBuffer += chunk.delta;

              // Process complete lines
              while (lineBuffer.includes('\n')) {
                const idx = lineBuffer.indexOf('\n');
                const line = lineBuffer.substring(0, idx);
                lineBuffer = lineBuffer.substring(idx + 1);
                processLine(line, controller);
              }
            },
          })
        ),
        ...rest,
      };
    },
  };
}
