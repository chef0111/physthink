import { type UIMessage } from '@ai-sdk/react';

const THOUGHT_DURATION_RE = /^Thought for [\d.]+s$/;
const THOUGHT_DURATION_SECONDS_RE = /^Thought for ([\d.]+) seconds?$/i;
const URL_RE = /https?:\/\/[^\s)]+/g;
const TOKEN_RE = /\b[A-Za-z0-9+/_-]{32,}\b/g;

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
    .replace(URL_RE, '[redacted]')
    .replace(TOKEN_RE, '[redacted]')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(
      (line) =>
        !line.toLowerCase().includes('trace:') &&
        !line.toLowerCase().includes('raw payload') &&
        !line.toLowerCase().includes('tool output:')
    )
    .join('\n');
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
  };
}

export function dbMessagesToAiMessages(
  dbMessages: Array<{
    id: string;
    role: string;
    content: string;
    parts?: unknown;
    createdAt: Date;
  }>
): UIMessage[] {
  return dbMessages.map((m) => ({
    id: m.id,
    role: m.role as UIMessage['role'],
    parts: Array.isArray(m.parts)
      ? (m.parts as UIMessage['parts'])
      : [{ type: 'text' as const, text: m.content }],
  }));
}
