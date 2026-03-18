import { type UIMessage } from '@ai-sdk/react';

const THOUGHT_DURATION_RE = /^Thought for [\d.]+s$/;
const THOUGHT_DURATION_SECONDS_RE = /^Thought for ([\d.]+) seconds?$/i;
const URL_RE = /https?:\/\/[^\s)]+/g;
const TOKEN_RE = /\b[A-Za-z0-9+/_-]{32,}\b/g;
const TOOL_CALL_BLOCK_RE = /<tool_call>[\s\S]*?<\/tool_call>/gi;
const TOOL_CALL_SENTINEL_RE =
  /<\/??tool_call>|FN_CALL\s*=\s*TRUE|"name"\s*:\s*"[^"]+"\s*,\s*"arguments"\s*:/i;
const REASONING_LEAK_LINE_RE =
  /^(we need to\b|the user asked\b|let me think\b|i should\b|internal plan\b|analysis\s*:|reasoning\s*:)/i;
const SECRET_KV_RE =
  /\b(api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|bearer|secret|password)\b\s*[:=]\s*(["'])?[^\s,'"}]+\2?/gi;

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

export function sanitizeReasoningClient(text: string): string {
  return text
    .replace(TOOL_CALL_BLOCK_RE, '')
    .replace(URL_RE, '[redacted]')
    .replace(TOKEN_RE, '[redacted]')
    .replace(SECRET_KV_RE, '$1: [redacted]')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(
      (line) =>
        !TOOL_CALL_SENTINEL_RE.test(line) &&
        !line.toLowerCase().includes('trace:') &&
        !line.toLowerCase().includes('raw payload') &&
        !line.toLowerCase().includes('tool output:')
    )
    .join('\n');
}

export function isToolCallPayloadText(text: string): boolean {
  return TOOL_CALL_SENTINEL_RE.test(text.trim());
}

export function sanitizeAssistantTextForDisplay(text: string): string {
  return text
    .replace(TOOL_CALL_BLOCK_RE, '')
    .replace(URL_RE, '[redacted]')
    .replace(TOKEN_RE, '[redacted]')
    .replace(SECRET_KV_RE, '$1: [redacted]')
    .split('\n')
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 &&
        !TOOL_CALL_SENTINEL_RE.test(line) &&
        !REASONING_LEAK_LINE_RE.test(line)
    )
    .join('\n')
    .trim();
}

export function formatReasoningForDisplay(text: string): string {
  const sanitized = sanitizeReasoningClient(text);
  if (!sanitized) return '';

  const lines = sanitized
    .split('\n')
    .flatMap((line) =>
      line
        .split(/(?<=[.;!?])\s+(?=[A-Z0-9(])/g)
        .map((segment) => segment.trim())
        .filter(Boolean)
    )
    .map((line) => (line.length > 260 ? `${line.slice(0, 260)}...` : line))
    .slice(0, 24);

  return lines.join('\n');
}

export function toReasoningSteps(text: string): string[] {
  return formatReasoningForDisplay(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 24);
}

type DebugGenerationData = {
  stepCount: number;
  stopReason: string;
  elapsedSec: number;
  toolCallCount: number;
};

type RetryAdviceData = {
  shouldRetry: boolean;
  reason: string;
  stage: 'preliminary' | 'final';
};

type StreamErrorData = {
  recoverable: boolean;
  stage: string;
  reason: string;
};

type GenerationMetadataData = {
  finishReason: string;
  totalToolAttempts: number;
  attemptCountByTool: Record<string, number>;
  forceTextOnly: boolean;
  fallbackReason: string | null;
};

export function readDebugGenerationData(
  part: UIMessage['parts'][number]
): DebugGenerationData | null {
  if (part.type !== 'data-debug-generation') return null;
  if (!('data' in part) || !part.data || typeof part.data !== 'object') {
    return null;
  }

  const data = part.data as Record<string, unknown>;
  return {
    stepCount: typeof data.stepCount === 'number' ? data.stepCount : 0,
    stopReason:
      typeof data.stopReason === 'string' ? data.stopReason : 'unknown',
    elapsedSec: typeof data.elapsedSec === 'number' ? data.elapsedSec : 0,
    toolCallCount:
      typeof data.toolCallCount === 'number' ? data.toolCallCount : 0,
  };
}

export function readRetryAdviceData(
  part: UIMessage['parts'][number]
): RetryAdviceData | null {
  if (part.type !== 'data-retry-advice') return null;
  if (!('data' in part) || !part.data || typeof part.data !== 'object') {
    return null;
  }

  const data = part.data as Record<string, unknown>;
  return {
    shouldRetry: Boolean(data.shouldRetry),
    reason: typeof data.reason === 'string' ? data.reason : 'unknown',
    stage: data.stage === 'preliminary' ? 'preliminary' : 'final',
  };
}

export function readStreamErrorData(
  part: UIMessage['parts'][number]
): StreamErrorData | null {
  if (part.type !== 'data-stream-error') return null;
  if (!('data' in part) || !part.data || typeof part.data !== 'object') {
    return null;
  }

  const data = part.data as Record<string, unknown>;
  return {
    recoverable: data.recoverable !== false,
    stage: typeof data.stage === 'string' ? data.stage : 'unknown',
    reason: typeof data.reason === 'string' ? data.reason : 'stream-error',
  };
}

export function readGenerationMetadataData(
  part: UIMessage['parts'][number]
): GenerationMetadataData | null {
  if (part.type !== 'data-generation-metadata') return null;
  if (!('data' in part) || !part.data || typeof part.data !== 'object') {
    return null;
  }

  const data = part.data as Record<string, unknown>;
  return {
    finishReason:
      typeof data.finishReason === 'string' ? data.finishReason : 'unknown',
    totalToolAttempts:
      typeof data.totalToolAttempts === 'number' ? data.totalToolAttempts : 0,
    attemptCountByTool:
      data.attemptCountByTool && typeof data.attemptCountByTool === 'object'
        ? (data.attemptCountByTool as Record<string, number>)
        : {},
    forceTextOnly: Boolean(data.forceTextOnly),
    fallbackReason:
      typeof data.fallbackReason === 'string' ? data.fallbackReason : null,
  };
}

export function dbMessagesToAiMessages(
  dbMessages: Array<{
    id: string;
    role: string;
    content: string;
    parts?: unknown;
    reasoningDurations?: unknown;
    createdAt: Date;
  }>
): UIMessage[] {
  return dbMessages.map((m) => {
    const baseParts = Array.isArray(m.parts)
      ? (m.parts as UIMessage['parts'])
      : ([{ type: 'text' as const, text: m.content }] as UIMessage['parts']);

    const persistedDurations = Array.isArray(m.reasoningDurations)
      ? (m.reasoningDurations as unknown[])
      : [];

    let reasoningCursor = 0;
    const hydratedParts = baseParts.map((part) => {
      if (part.type !== 'reasoning') return part;

      const existingDuration =
        typeof (part as { durationText?: unknown }).durationText === 'string'
          ? (part as { durationText?: string }).durationText
          : null;
      if (existingDuration) {
        reasoningCursor += 1;
        return part;
      }

      const raw = persistedDurations[reasoningCursor];
      reasoningCursor += 1;

      if (typeof raw !== 'number' || !Number.isFinite(raw)) {
        return part;
      }

      const rounded = Math.max(1, Math.round(raw));
      return {
        ...part,
        durationText: `Thought for ${rounded}s`,
      };
    });

    return {
      id: m.id,
      role: m.role as UIMessage['role'],
      parts: hydratedParts,
    };
  });
}

/**
 * Builds a messageId → feedback map from persisted DB messages so that the
 * chat UI can hydrate like/dislike state on initial load without an extra
 * network round-trip.
 */
export function extractFeedbackMap(
  dbMessages: Array<{ id: string; feedback?: string | null }>
): Map<string, 'like' | 'dislike'> {
  const map = new Map<string, 'like' | 'dislike'>();
  for (const m of dbMessages) {
    if (m.feedback === 'like' || m.feedback === 'dislike') {
      map.set(m.id, m.feedback);
    }
  }
  return map;
}
