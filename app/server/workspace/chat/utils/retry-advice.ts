import { normalizeThoughtDuration } from './base';
import type { RetryAdvice, RetryAdviceStage, RetryAdviceState } from './types';

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
