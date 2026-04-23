import type { ResponseMsg } from './types';

/**
 * Convert AI SDK response messages into the UIMessage parts format
 * so reasoning, tool calls, and tool results are persisted to the DB.
 */
export function responseToUIParts(responseMessages: readonly ResponseMsg[]) {
  const parts: Array<Record<string, unknown>> = [];
  const toolOutcomes = new Map<
    string,
    { state: 'output-available'; output: unknown } | { state: 'output-error' }
  >();

  for (const msg of responseMessages) {
    if (msg.role !== 'tool' || typeof msg.content === 'string') continue;
    for (const part of msg.content) {
      if (part.type === 'tool-result' && 'toolCallId' in part) {
        const toolCallId = part.toolCallId as string;
        const output =
          (part as { output?: unknown; result?: unknown }).output ??
          (part as { result?: unknown }).result;
        const state =
          typeof (part as { state?: string }).state === 'string'
            ? (part as { state?: string }).state
            : undefined;
        const hasErrorFlag =
          Boolean((part as { isError?: boolean }).isError) ||
          state === 'output-error';

        toolOutcomes.set(
          toolCallId,
          hasErrorFlag
            ? { state: 'output-error' }
            : { state: 'output-available', output }
        );
      } else if (part.type === 'tool-error' && 'toolCallId' in part) {
        toolOutcomes.set(part.toolCallId as string, { state: 'output-error' });
      }
    }
  }

  const seenToolCallIds = new Set<string>();
  const sceneToolDedupKeys = new Set<string>();
  const sceneToolErrorDedupKeys = new Set<string>();

  const isSceneMutationTool = (toolName: string) =>
    toolName === 'addElement' ||
    toolName === 'addElements' ||
    toolName === 'setSceneSettings';

  const isInvisiblePersistenceTool = (toolName: string) =>
    toolName === 'memory';

  for (const msg of responseMessages) {
    if (msg.role !== 'assistant') continue;
    if (typeof msg.content === 'string') {
      if (msg.content) parts.push({ type: 'text', text: msg.content });
      continue;
    }
    for (const part of msg.content) {
      if (part.type === 'text' && part.text) {
        parts.push({ type: 'text', text: part.text as string });
      } else if (part.type === 'reasoning' && part.text) {
        parts.push({ type: 'reasoning', text: part.text as string });
      } else if (part.type === 'tool-call') {
        const toolName = part.toolName as string;
        if (isInvisiblePersistenceTool(toolName)) continue;

        const toolCallId = part.toolCallId as string;
        if (seenToolCallIds.has(toolCallId)) continue;
        seenToolCallIds.add(toolCallId);

        const outcome = toolOutcomes.get(toolCallId);
        const toolInput =
          (part as { input?: unknown; args?: unknown }).input ??
          (part as { args?: unknown }).args;

        const partState =
          typeof (part as { state?: string }).state === 'string'
            ? (part as { state?: string }).state
            : undefined;

        const normalizedState = outcome
          ? outcome.state
          : partState === 'output-error'
            ? 'output-error'
            : 'input-available';

        // Ignore unresolved in-flight tool calls during persistence.
        // These are transient stream artifacts that should not rehydrate as UI cards.
        if (!outcome && normalizedState === 'input-available') continue;

        // Scene mutation tools can retry many times in one completion.
        // Persist unique successful calls and only keep one standalone error
        // when there is no successful attempt for the same input.
        if (isSceneMutationTool(toolName)) {
          const dedupKey = `${toolName}:${JSON.stringify(toolInput ?? {})}`;
          if (normalizedState === 'output-error') {
            if (sceneToolDedupKeys.has(dedupKey)) continue;
            if (sceneToolErrorDedupKeys.has(dedupKey)) continue;
            sceneToolErrorDedupKeys.add(dedupKey);
          } else {
            if (sceneToolDedupKeys.has(dedupKey)) continue;
            sceneToolDedupKeys.add(dedupKey);
          }
        }

        parts.push({
          type: `tool-${toolName}`,
          toolCallId,
          toolName,
          state: normalizedState,
          input: toolInput,
          ...(outcome && outcome.state === 'output-available'
            ? { output: outcome.output }
            : {}),
        });
      }
    }
  }

  return parts;
}
