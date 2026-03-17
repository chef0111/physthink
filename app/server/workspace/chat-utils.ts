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

export type GenerationDebugData = {
  stepCount: number;
  stopReason: string;
  elapsedSec: number;
  toolCallCount: number;
};

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
  const toolResults = new Map<string, unknown>();

  for (const msg of responseMessages) {
    if (msg.role !== 'tool' || typeof msg.content === 'string') continue;
    for (const part of msg.content) {
      if (part.type === 'tool-result' && 'toolCallId' in part) {
        toolResults.set(
          part.toolCallId as string,
          (part as { output?: unknown; result?: unknown }).output ??
            (part as { result?: unknown }).result
        );
      }
    }
  }

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
        const result = toolResults.get(toolCallId);
        const toolInput =
          (part as { input?: unknown; args?: unknown }).input ??
          (part as { args?: unknown }).args;
        parts.push({
          type: `tool-${toolName}`,
          toolCallId,
          toolName,
          state: result !== undefined ? 'output-available' : 'input-available',
          input: toolInput,
          ...(result !== undefined ? { output: result } : {}),
        });
      }
    }
  }

  const mergedElements: unknown[] = [];
  let firstAddElementsId: string | null = null;
  const dedupedParts: Array<Record<string, unknown>> = [];

  for (const p of parts) {
    if (p.toolName === 'addElements' && p.state === 'output-available') {
      const output = p.output as Record<string, unknown> | undefined;
      const els = output?.elements;
      if (Array.isArray(els)) {
        mergedElements.push(...els);
        if (!firstAddElementsId) firstAddElementsId = p.toolCallId as string;
        continue;
      }
    }
    if (p.toolName === 'addElement' && p.state === 'output-available') {
      const output = p.output as Record<string, unknown> | undefined;
      if (output?.element) {
        mergedElements.push(output.element);
        if (!firstAddElementsId) firstAddElementsId = p.toolCallId as string;
        continue;
      }
    }
    dedupedParts.push(p);
  }

  if (mergedElements.length > 0 && firstAddElementsId) {
    const seen = new Set<string>();
    const uniqueElements: unknown[] = [];
    for (const el of mergedElements) {
      const e = el as Record<string, unknown>;
      const pos = (e.position as number[]) ?? [0, 0, 0];
      const rp = pos.map((v) => Math.round(v * 100) / 100);
      let fp = `${e.type}|${rp.join(',')}`;
      if (e.type === 'preset') fp += `|${e.presetId ?? ''}`;
      else if (e.type === 'mesh') fp += `|${e.geometry ?? ''}`;
      else if (e.type === 'vector') {
        const to = (e.to as number[]) ?? [0, 0, 0];
        fp += `|${to.map((v) => Math.round(v * 100) / 100).join(',')}`;
      }
      if (!seen.has(fp)) {
        seen.add(fp);
        uniqueElements.push(el);
      }
    }
    dedupedParts.push({
      type: 'tool-addElements',
      toolCallId: firstAddElementsId,
      toolName: 'addElements',
      state: 'output-available',
      input: { elements: uniqueElements },
      output: { action: 'addElements', elements: uniqueElements },
    });
  }

  return dedupedParts;
}

export function assignReasoningDurations(
  assistantPartsRaw: Array<Record<string, unknown>>,
  elapsedSec: number
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

  const reasoningCount = reasoningIndexes.length;
  const perChainFallbackSec =
    reasoningCount > 0
      ? Math.max(1, Math.round(elapsedSec / reasoningCount))
      : elapsedSec;

  const assistantPartsWithDurations = assistantPartsRaw.map((part, index) => {
    if (part.type !== 'reasoning') return part;

    const durationText =
      assignedDurations.get(index) ?? `Thought for ${perChainFallbackSec}s`;

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

  const stopReason =
    typeof responseWithDebug.finishReason === 'string'
      ? responseWithDebug.finishReason
      : typeof responseWithDebug.finishReason?.unified === 'string'
        ? responseWithDebug.finishReason.unified
        : typeof responseWithDebug.finishReason?.raw === 'string'
          ? responseWithDebug.finishReason.raw
          : 'unknown';

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

  const hasMalformedToolCallText = textParts.some((part) => {
    const text = part.text.trim();
    if (/FN_CALL\s*=\s*TRUE/i.test(text)) return true;
    if (/"name"\s*:\s*"[^"]+"\s*,\s*"arguments"\s*:/i.test(text)) {
      return true;
    }
    return false;
  });

  const hasVisibleText = textParts.some((part) => {
    const text = part.text.trim();
    if (!text) return false;
    if (normalizeThoughtDuration(text)) return false;
    if (/FN_CALL\s*=\s*TRUE/i.test(text)) return false;
    if (/"name"\s*:\s*"[^"]+"\s*,\s*"arguments"\s*:/i.test(text)) {
      return false;
    }
    return true;
  });

  const hasReasoning = assistantParts.some(
    (part) => part.type === 'reasoning' && typeof part.text === 'string'
  );

  const stopReasonUnknown = stopReason === 'unknown';

  const shouldRetry =
    hasMalformedToolCallText ||
    (!hasVisibleText && (stopReasonUnknown || !hasToolCalls || hasReasoning));

  let reason = 'none';
  if (hasMalformedToolCallText) reason = 'malformed-tool-call-text';
  else if (!hasVisibleText && stopReasonUnknown) reason = 'unknown-stop';
  else if (!hasVisibleText && !hasToolCalls) reason = 'no-tool-no-answer';
  else if (!hasVisibleText && hasReasoning) reason = 'reasoning-without-answer';

  return { shouldRetry, reason };
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
    return {
      type: 'data-retry-advice',
      data: {
        shouldRetry: Boolean(data.shouldRetry),
        reason:
          typeof data.reason === 'string'
            ? sanitizeTextStrict(data.reason, { maxChars: 80 })
            : 'unknown',
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
