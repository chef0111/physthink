import type { UIMessage } from 'ai';

const MAX_CONTEXT_MESSAGES = 20;
const THOUGHT_DURATION_RE = /^Thought for [\d.]+s$/;
const THOUGHT_DURATION_SECONDS_RE = /^Thought for ([\d.]+) seconds?$/i;

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
