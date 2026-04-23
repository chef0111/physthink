import {
  projectSafeFields,
  sanitizeReasoningText,
  sanitizeTextStrict,
  sanitizeUnknownStrict,
} from '@/lib/knowledge/utils';
import type { RetryAdviceStage } from './types';

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
