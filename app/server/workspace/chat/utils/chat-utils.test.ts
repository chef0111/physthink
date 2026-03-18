import { describe, expect, it, vi } from 'vitest';
import {
  getRetryAdvice,
  getRetryAdviceFromStreamState,
  sanitizePersistedPart,
} from '.';

vi.mock('server-only', () => ({}));

describe('chat retry advice', () => {
  it('emits preliminary retry advice for malformed tool-call text', () => {
    const advice = getRetryAdviceFromStreamState(
      {
        textContent: 'FN_CALL=True\\n{"name":"addElements","arguments":{}}',
        reasoningContent: '',
        hasToolCalls: false,
        stopReason: 'unknown',
      },
      'preliminary'
    );

    expect(advice.shouldRetry).toBe(true);
    expect(advice.reason).toBe('malformed-tool-call-text');
    expect(advice.stage).toBe('preliminary');
  });

  it('computes final retry advice from assistant parts', () => {
    const advice = getRetryAdvice(
      [
        { type: 'reasoning', text: 'Thinking through setup' },
        { type: 'text', text: 'Thought for 2s' },
      ],
      'unknown'
    );

    expect(advice.shouldRetry).toBe(true);
    expect(advice.reason).toBe('unknown-stop');
  });

  it('sanitizes retry advice and keeps stage', () => {
    const sanitized = sanitizePersistedPart({
      type: 'data-retry-advice',
      data: {
        shouldRetry: true,
        reason: 'malformed-tool-call-text',
        stage: 'final',
      },
    });

    expect(sanitized).toEqual({
      type: 'data-retry-advice',
      data: {
        shouldRetry: true,
        reason: 'malformed-tool-call-text',
        stage: 'final',
      },
    });
  });
});
