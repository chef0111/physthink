import { LAST_WINS_TOOLS, MERGE_TOOLS } from './constants';
import type { ToolCall } from './types';

/**
 * Deduplicates tool calls:
 * - For LAST_WINS_TOOLS: keeps only the last call per tool name
 * - For MERGE_TOOLS: merges all calls into one, combining element arrays
 * - All other tools: kept as-is
 */
export function deduplicateToolCalls(calls: ToolCall[]): ToolCall[] {
  const mergedElements: Record<string, unknown[]> = {};
  const mergeIds: Record<string, string> = {};
  const lastWins: Record<string, number> = {};

  for (let i = 0; i < calls.length; i++) {
    const tc = calls[i];
    if (LAST_WINS_TOOLS.has(tc.toolName)) {
      lastWins[tc.toolName] = i;
    }
    if (MERGE_TOOLS.has(tc.toolName)) {
      try {
        const parsed = JSON.parse(tc.args);
        const elements = Array.isArray(parsed)
          ? parsed
          : Array.isArray((parsed as { elements?: unknown[] }).elements)
            ? (parsed as { elements: unknown[] }).elements
            : null;
        if (elements && elements.length > 0) {
          if (!mergedElements[tc.toolName]) {
            mergedElements[tc.toolName] = [];
            mergeIds[tc.toolName] = tc.id;
          }
          mergedElements[tc.toolName].push(...elements);
        }
      } catch {
        // If JSON parse fails, drop the call
      }
    }
  }

  const result: ToolCall[] = [];
  const emittedMerge = new Set<string>();

  for (let i = 0; i < calls.length; i++) {
    const tc = calls[i];

    if (LAST_WINS_TOOLS.has(tc.toolName)) {
      if (lastWins[tc.toolName] === i) {
        result.push(tc);
      }
      continue;
    }

    if (MERGE_TOOLS.has(tc.toolName)) {
      if (mergedElements[tc.toolName] && !emittedMerge.has(tc.toolName)) {
        emittedMerge.add(tc.toolName);
        result.push({
          id: mergeIds[tc.toolName],
          toolName: tc.toolName,
          args: JSON.stringify({ elements: mergedElements[tc.toolName] }),
        });
      }
      continue;
    }

    result.push(tc);
  }

  return result;
}

/**
 * Deduplicates tool-call parts within wrapGenerate content array.
 * Extracts tool-call parts, deduplicates, and reinserts.
 */
export function deduplicateContentToolCalls<
  T extends { type: string; [key: string]: unknown },
>(content: T[]): T[] {
  const toolCallParts: ToolCall[] = [];
  const nonToolParts: T[] = [];

  for (const part of content) {
    if (part.type === 'tool-call') {
      toolCallParts.push({
        id: part.toolCallId as string,
        toolName: part.toolName as string,
        args: part.input as string,
      });
    } else {
      nonToolParts.push(part);
    }
  }

  if (toolCallParts.length <= 1) return content;

  const deduped = deduplicateToolCalls(toolCallParts);
  return [
    ...nonToolParts,
    ...deduped.map(
      (tc) =>
        ({
          type: 'tool-call' as const,
          toolCallId: tc.id,
          toolName: tc.toolName,
          input: tc.args,
        }) as unknown as T
    ),
  ];
}
