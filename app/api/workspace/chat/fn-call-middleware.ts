import type {
  LanguageModelV3Middleware,
  LanguageModelV3StreamPart,
} from '@ai-sdk/provider';

/**
 * Tags the model may use to wrap tool-call JSON.
 * Matched case-insensitively.
 */
const TOOL_TAG_NAMES = 'tool_call|think_faster|function_call';
const TOOL_TAG_OPEN_RE = new RegExp(`<(${TOOL_TAG_NAMES})>`, 'i');
const TOOL_TAG_PAIR_RE = new RegExp(
  `<(${TOOL_TAG_NAMES})>\\s*([\\s\\S]*?)\\s*<\\/\\1>`,
  'gi'
);

/**
 * Middleware that intercepts text-based tool call formats from models that
 * don't support OpenAI-native function calling, and converts them into
 * proper tool-call stream events.
 *
 * Supported formats:
 *   1. FN_CALL=True
 *      toolName(key="value", key2=123, key3={"nested": "json"})
 *
 *   2. <tag>{"name":"toolName","arguments":{"key":"value"}}</tag>
 *      where tag is: tool_call, think_faster, function_call
 */
export function extractFnCallMiddleware(): LanguageModelV3Middleware {
  return {
    specificationVersion: 'v3',

    wrapGenerate: async ({ doGenerate }) => {
      const result = await doGenerate();
      const transformedContent: typeof result.content = [];
      let hasToolCalls = false;
      let idCounter = 0;
      const seenToolCalls = new Set<string>();

      const pushToolCall = (
        toolName: string,
        args: Record<string, unknown> | undefined
      ) => {
        const input = JSON.stringify(args || {});
        const signature = `${toolName}::${input}`;
        if (seenToolCalls.has(signature)) return;
        seenToolCalls.add(signature);
        transformedContent.push({
          type: 'tool-call',
          toolCallId: `fn-${idCounter++}`,
          toolName,
          input,
        });
        hasToolCalls = true;
      };

      for (const part of result.content) {
        if (part.type !== 'text') {
          transformedContent.push(part);
          continue;
        }

        const fnCallIdx = part.text.indexOf('FN_CALL=True');
        if (fnCallIdx === -1) {
          // Check for tagged JSON format: <tool_call>, <think_faster>, etc.
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
              pushToolCall(parsed.name, parsed.arguments);
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
            pushToolCall(parsed.toolName, parsed.args);
          }
        }
      }

      return {
        ...result,
        content: transformedContent,
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
      const toolCalls: Array<{
        id: string;
        toolName: string;
        args: string;
      }> = [];
      let idCounter = 0;
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
                id: `fn-${idCounter++}`,
                toolName: parsed.name,
                args: JSON.stringify(parsed.arguments || {}),
              });
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

        // Check for tool-call tag on this line (<tool_call>, <think_faster>, etc.)
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
                id: `fn-${idCounter++}`,
                toolName: parsed.name,
                args: JSON.stringify(parsed.arguments || {}),
              });
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
                id: `fn-${idCounter++}`,
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
                id: `fn-${idCounter++}`,
                toolName: parsed.name,
                args: JSON.stringify(parsed.arguments || {}),
              });
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
                id: `fn-${idCounter++}`,
                toolName: parsed.name,
                args: JSON.stringify(parsed.arguments || {}),
              });
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
                  id: `fn-${idCounter++}`,
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
              id: `fn-${idCounter++}`,
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
        const seen = new Set<string>();
        for (const tc of toolCalls) {
          const signature = `${tc.toolName}::${tc.args}`;
          if (seen.has(signature)) continue;
          seen.add(signature);
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

// ---------------------------------------------------------------------------
// FN_CALL argument parser
// ---------------------------------------------------------------------------

/**
 * Parse a JSON tool call from <tool_call> tag content:
 *   {"name":"toolName","arguments":{"key":"value"}}
 */
function parseToolCallJson(
  s: string
): { name: string; arguments?: Record<string, unknown> } | null {
  try {
    const json = JSON.parse(s);
    if (typeof json.name === 'string') return json;
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse a single function-call line:
 *   toolName(key="value", key2=123, key3={"a":1})
 */
function parseFnCallLine(
  line: string
): { toolName: string; args: Record<string, unknown> } | null {
  const parenIdx = line.indexOf('(');
  if (parenIdx < 0 || !line.endsWith(')')) return null;

  const toolName = line.substring(0, parenIdx).trim();
  if (!toolName || !/^\w+$/.test(toolName)) return null;

  const inner = line.substring(parenIdx + 1, line.length - 1).trim();
  if (!inner) return { toolName, args: {} };

  return { toolName, args: parseKeyValueArgs(inner) };
}

/**
 * Parse key=value pairs from inside parentheses, handling nested JSON.
 */
function parseKeyValueArgs(s: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let i = 0;

  while (i < s.length) {
    // Skip whitespace
    while (i < s.length && s[i] === ' ') i++;
    if (i >= s.length) break;

    // Read key (identifier chars)
    let key = '';
    while (i < s.length && s[i] !== '=') key += s[i++];
    key = key.trim();
    if (i >= s.length || !key) break;
    i++; // skip '='

    // Skip whitespace after '='
    while (i < s.length && s[i] === ' ') i++;

    // Read value
    const [value, nextI] = readValue(s, i);
    result[key] = value;
    i = nextI;

    // Skip comma + whitespace
    while (i < s.length && (s[i] === ',' || s[i] === ' ')) i++;
  }

  return result;
}

function readValue(s: string, i: number): [unknown, number] {
  if (i >= s.length) return ['', i];

  const ch = s[i];

  // Quoted string
  if (ch === '"' || ch === "'") {
    return readQuotedString(s, i, ch);
  }

  // JSON object or array
  if (ch === '{' || ch === '[') {
    return readBracketedValue(s, i);
  }

  // Boolean / number / bare word — read until comma or end
  let raw = '';
  while (i < s.length && s[i] !== ',') raw += s[i++];
  raw = raw.trim();

  if (/^true$/i.test(raw)) return [true, i];
  if (/^false$/i.test(raw)) return [false, i];
  if (raw === 'None' || raw === 'null') return [null, i];
  if (/^-?\d+(\.\d+)?$/.test(raw)) return [parseFloat(raw), i];
  return [raw, i];
}

function readQuotedString(
  s: string,
  i: number,
  quote: string
): [string, number] {
  i++; // skip opening quote
  let result = '';
  while (i < s.length) {
    if (s[i] === '\\' && i + 1 < s.length) {
      result += s[i + 1];
      i += 2;
    } else if (s[i] === quote) {
      return [result, i + 1];
    } else {
      result += s[i++];
    }
  }
  return [result, i];
}

function readBracketedValue(s: string, i: number): [unknown, number] {
  const start = i;
  let depth = 0;
  let inStr = false;
  let strChar = '';

  while (i < s.length) {
    const ch = s[i];

    if (inStr) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === strChar) inStr = false;
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inStr = true;
      strChar = ch;
      i++;
      continue;
    }

    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) {
        const json = s.substring(start, i + 1);
        try {
          return [JSON.parse(json), i + 1];
        } catch {
          return [json, i + 1];
        }
      }
    }
    i++;
  }

  // Incomplete bracket — return as-is
  const json = s.substring(start, i);
  try {
    return [JSON.parse(json), i];
  } catch {
    return [json, i];
  }
}
