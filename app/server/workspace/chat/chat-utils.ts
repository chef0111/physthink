import type { UIMessage } from 'ai';
import {
  projectSafeFields,
  sanitizeReasoningText,
  sanitizeTextStrict,
  sanitizeUnknownStrict,
} from '@/lib/knowledge/utils';

const MAX_CONTEXT_MESSAGES = 20;
const THOUGHT_DURATION_RE = /^Thought for [\d.]+s$/;
const THOUGHT_DURATION_SECONDS_RE = /^Thought for ([\d.]+) seconds?$/i;

export interface ResponsePart {
  type: string;
  text?: string;
  toolCallId?: string;
  toolName?: string;
  input?: unknown;
  args?: unknown;
  output?: unknown;
  result?: unknown;
  state?: string;
  durationText?: string;
}

interface ResponseMsg {
  role: string;
  content: string | readonly ResponsePart[];
}

type RetryAdvice = {
  shouldRetry: boolean;
  reason: string;
};

export type RetryAdviceStage = 'preliminary' | 'final';

type RetryAdviceState = {
  textContent: string;
  reasoningContent: string;
  hasToolCalls: boolean;
  stopReason: string;
};

export type GenerationDebugData = {
  stepCount: number;
  stopReason: string;
  elapsedSec: number;
  toolCallCount: number;
};

export function normalizeFinishReason(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (!raw || typeof raw !== 'object') return 'unknown';

  const candidate = raw as { unified?: unknown; raw?: unknown };
  if (typeof candidate.unified === 'string') return candidate.unified;
  if (typeof candidate.raw === 'string') return candidate.raw;

  return 'unknown';
}

export function normalizeThoughtDuration(text: string): string | null {
  const normalized = text.trim();
  if (THOUGHT_DURATION_RE.test(normalized)) return normalized;
  const secondsMatch = normalized.match(THOUGHT_DURATION_SECONDS_RE);
  if (!secondsMatch) return null;
  const value = Number(secondsMatch[1]);
  if (!Number.isFinite(value)) return null;
  const rounded = Number.isInteger(value) ? value : Number(value.toFixed(1));
  return `Thought for ${rounded}s`;
}

export function truncateMessages(messages: UIMessage[]): UIMessage[] {
  if (messages.length <= MAX_CONTEXT_MESSAGES) return messages;
  return messages.slice(-MAX_CONTEXT_MESSAGES);
}

export function buildSceneContext(sceneData: {
  elements: Array<{ id: string; type: string; label?: string }>;
  sceneSettings: Record<string, unknown>;
}): string {
  if (!sceneData?.elements?.length) return 'Scene is empty.';

  const elementSummary = sceneData.elements
    .map((el) => `- ${el.id} (${el.type}${el.label ? `: ${el.label}` : ''})`)
    .join('\n');

  return `${sceneData.elements.length} element(s):\n${elementSummary}\nSettings: ${JSON.stringify(sceneData.sceneSettings)}`;
}

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

  const isSceneMutationTool = (toolName: string) =>
    toolName === 'addElement' ||
    toolName === 'addElements' ||
    toolName === 'setSceneSettings';

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
        // Persist only successful unique calls and skip noisy error attempts.
        if (isSceneMutationTool(toolName)) {
          if (normalizedState === 'output-error') continue;
          const dedupKey = `${toolName}:${JSON.stringify(toolInput ?? {})}`;
          if (sceneToolDedupKeys.has(dedupKey)) continue;
          sceneToolDedupKeys.add(dedupKey);
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

function getRetryAdviceFromState(state: RetryAdviceState): RetryAdvice {
  const text = state.textContent.trim();
  const reasoning = state.reasoningContent.trim();
  const stopReasonUnknown = state.stopReason === 'unknown';

  const hasMalformedToolCallText =
    /FN_CALL\s*=\s*TRUE/i.test(text) ||
    /"name"\s*:\s*"[^"]+"\s*,\s*"arguments"\s*:/i.test(text);

  const visibleLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !normalizeThoughtDuration(line))
    .filter((line) => !/FN_CALL\s*=\s*TRUE/i.test(line))
    .filter(
      (line) => !/"name"\s*:\s*"[^"]+"\s*,\s*"arguments"\s*:/i.test(line)
    );

  const hasVisibleText = visibleLines.length > 0;
  const hasReasoning = reasoning.length > 0;

  const shouldRetry =
    hasMalformedToolCallText ||
    (!hasVisibleText &&
      (stopReasonUnknown || !state.hasToolCalls || hasReasoning));

  let reason = 'none';
  if (hasMalformedToolCallText) reason = 'malformed-tool-call-text';
  else if (!hasVisibleText && stopReasonUnknown) reason = 'unknown-stop';
  else if (!hasVisibleText && !state.hasToolCalls) reason = 'no-tool-no-answer';
  else if (!hasVisibleText && hasReasoning) reason = 'reasoning-without-answer';

  return { shouldRetry, reason };
}

export function getRetryAdviceFromStreamState(
  state: RetryAdviceState,
  stage: RetryAdviceStage
) {
  return {
    ...getRetryAdviceFromState(state),
    stage,
  };
}

export function assignReasoningDurations(
  assistantPartsRaw: Array<Record<string, unknown>>,
  _elapsedSec: number,
  streamedReasoningDurationsSec: number[] = []
) {
  const durationMarkers = assistantPartsRaw
    .map((part, index) => {
      if (part.type !== 'text' || typeof part.text !== 'string') return null;
      const duration = normalizeThoughtDuration(part.text);
      return duration ? { index, duration } : null;
    })
    .filter(
      (item): item is { index: number; duration: string } => item !== null
    );

  const reasoningIndexes = assistantPartsRaw
    .map((part, index) => ({ part, index }))
    .filter(
      ({ part }) => part.type === 'reasoning' && typeof part.text === 'string'
    )
    .map(({ index }) => index);
  const reasoningCount = reasoningIndexes.length;

  const assignedDurations = new Map<number, string>();
  const usedMarkerIndexes = new Set<number>();

  for (const reasoningIndex of reasoningIndexes) {
    const part = assistantPartsRaw[reasoningIndex];
    const explicitDuration =
      typeof part?.durationText === 'string'
        ? normalizeThoughtDuration(part.durationText)
        : null;
    if (explicitDuration) {
      assignedDurations.set(reasoningIndex, explicitDuration);
      continue;
    }

    const streamedDuration = streamedReasoningDurationsSec.shift();
    if (
      typeof streamedDuration === 'number' &&
      Number.isFinite(streamedDuration)
    ) {
      assignedDurations.set(
        reasoningIndex,
        `Thought for ${Math.max(1, Math.round(streamedDuration))}s`
      );
      continue;
    }

    let bestMarker: { index: number; duration: string } | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const marker of durationMarkers) {
      if (usedMarkerIndexes.has(marker.index)) continue;
      const distance = Math.abs(marker.index - reasoningIndex);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMarker = marker;
      }
    }

    if (bestMarker) {
      usedMarkerIndexes.add(bestMarker.index);
      assignedDurations.set(reasoningIndex, bestMarker.duration);
    }
  }

  const assistantPartsWithDurations = assistantPartsRaw.map((part, index) => {
    if (part.type !== 'reasoning') return part;

    const durationText = assignedDurations.get(index);
    if (!durationText) {
      return part;
    }

    return {
      ...part,
      durationText,
    };
  });

  return {
    assistantPartsWithDurations,
    reasoningCount,
  };
}

export function getGenerationDebugData(
  response: unknown,
  assistantPartsWithDurations: Array<Record<string, unknown>>,
  elapsedSec: number
): GenerationDebugData {
  const responseWithDebug = response as {
    finishReason?: { unified?: string; raw?: string } | string;
    steps?: unknown[];
  };

  const stopReason = normalizeFinishReason(responseWithDebug.finishReason);

  const toolCallCount = assistantPartsWithDurations.filter(
    (part) => typeof part.toolCallId === 'string'
  ).length;

  const stepCount = Array.isArray(responseWithDebug.steps)
    ? responseWithDebug.steps.length
    : Math.max(1, toolCallCount);

  return {
    stepCount,
    stopReason,
    toolCallCount,
    elapsedSec,
  };
}

export function getRetryAdvice(
  assistantParts: Array<Record<string, unknown>>,
  stopReason: string
): RetryAdvice {
  const hasToolCalls = assistantParts.some(
    (part) =>
      typeof part.toolCallId === 'string' && typeof part.state === 'string'
  );

  const textParts = assistantParts.filter(
    (part): part is { type: 'text'; text: string } =>
      part.type === 'text' && typeof part.text === 'string'
  );

  return getRetryAdviceFromState({
    textContent: textParts.map((part) => part.text).join('\n'),
    reasoningContent: assistantParts
      .filter(
        (part): part is { type: 'reasoning'; text: string } =>
          part.type === 'reasoning' && typeof part.text === 'string'
      )
      .map((part) => part.text)
      .join('\n'),
    hasToolCalls,
    stopReason,
  });
}

function sanitizeToolOutput(toolName: string, output: unknown): unknown {
  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return sanitizeUnknownStrict(output);
  }

  const raw = output as Record<string, unknown>;

  if (toolName === 'runProblemRagPipeline') {
    const safe = projectSafeFields(raw, [
      'found',
      'message',
      'warnings',
      'guidance',
      'dryRun',
      'topKUsed',
      'timings',
    ]);
    return {
      ...safe,
      retrievalCount: Array.isArray(raw.retrieval) ? raw.retrieval.length : 0,
    };
  }

  if (toolName === 'searchProblemExamples') {
    return projectSafeFields(raw, ['count', 'totalSamples', 'categories']);
  }

  if (toolName === 'getProblemExampleByKey') {
    return projectSafeFields(raw, ['found', 'source']);
  }

  return sanitizeUnknownStrict(raw, { maxDepth: 2, maxStringChars: 260 });
}

export function sanitizePersistedPart(
  part: Record<string, unknown>
): Record<string, unknown> {
  if (part.type === 'text' && typeof part.text === 'string') {
    return {
      ...part,
      text: sanitizeTextStrict(part.text, { maxChars: 2200 }),
    };
  }

  if (part.type === 'reasoning' && typeof part.text === 'string') {
    const durationText =
      typeof part.durationText === 'string'
        ? sanitizeTextStrict(part.durationText, { maxChars: 48 })
        : undefined;
    return {
      ...part,
      text: sanitizeReasoningText(part.text),
      ...(durationText ? { durationText } : {}),
    };
  }

  if (part.type === 'data-retry-advice' && typeof part.data === 'object') {
    const data = part.data as Record<string, unknown>;
    const stage: RetryAdviceStage =
      data.stage === 'preliminary' ? 'preliminary' : 'final';
    return {
      type: 'data-retry-advice',
      data: {
        shouldRetry: Boolean(data.shouldRetry),
        reason:
          typeof data.reason === 'string'
            ? sanitizeTextStrict(data.reason, { maxChars: 80 })
            : 'unknown',
        stage,
      },
    };
  }

  if (typeof part.toolName === 'string') {
    const sanitized: Record<string, unknown> = { ...part };
    if ('input' in sanitized) {
      sanitized.input = sanitizeUnknownStrict(sanitized.input, {
        maxDepth: 1,
        maxStringChars: 180,
      });
    }
    if ('output' in sanitized) {
      sanitized.output = sanitizeToolOutput(part.toolName, sanitized.output);
    }
    return sanitized;
  }

  return sanitizeUnknownStrict(part, {
    maxDepth: 2,
    maxStringChars: 220,
  }) as Record<string, unknown>;
}

export function assistantPartsToText(
  assistantParts: Array<Record<string, unknown>>
): string {
  return assistantParts
    .filter(
      (p): p is { type: string; text: string } =>
        p.type === 'text' && typeof p.text === 'string'
    )
    .map((p) => p.text)
    .join('\n');
}
