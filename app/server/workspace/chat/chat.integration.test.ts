import { describe, expect, it, vi } from 'vitest';
import { getRetryAdviceFromStreamState, responseToUIParts } from './chat-utils';

vi.mock('server-only', () => ({}));

describe('workspace chat integration behavior', () => {
  it('shapes heavy tool-call responses without dropping tool parts', () => {
    const heavyElements = Array.from({ length: 40 }, (_, index) => ({
      type: 'vector',
      label: `v${index}`,
      from: [index, 0, 0],
      to: [index, 1, 0],
    }));

    const parts = responseToUIParts([
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'tc-1',
            toolName: 'addElements',
            args: { elements: heavyElements },
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'tc-1',
            output: {
              action: 'addElements',
              elements: heavyElements,
            },
          },
        ],
      },
    ]);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe('tool-addElements');
    expect(parts[0].state).toBe('output-available');
    expect((parts[0].output as { elements: unknown[] }).elements).toHaveLength(
      40
    );
  });

  it('moves retry advice from preliminary to final during stream lifecycle', () => {
    const preliminary = getRetryAdviceFromStreamState(
      {
        textContent: '',
        reasoningContent: 'Thinking...',
        hasToolCalls: false,
        stopReason: 'unknown',
      },
      'preliminary'
    );

    const final = getRetryAdviceFromStreamState(
      {
        textContent: 'Final useful answer',
        reasoningContent: 'Thinking...',
        hasToolCalls: true,
        stopReason: 'stop',
      },
      'final'
    );

    expect(preliminary.stage).toBe('preliminary');
    expect(preliminary.shouldRetry).toBe(true);

    expect(final.stage).toBe('final');
    expect(final.shouldRetry).toBe(false);
  });
});
