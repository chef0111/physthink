import { describe, expect, it } from 'vitest';
import { deduplicateToolCalls } from './dedup';

describe('tool call dedup', () => {
  it('merges addElements calls into one', () => {
    const deduped = deduplicateToolCalls([
      {
        id: '1',
        toolName: 'addElements',
        args: JSON.stringify({ elements: [{ type: 'mesh', id: 'a' }] }),
      },
      {
        id: '2',
        toolName: 'addElements',
        args: JSON.stringify({ elements: [{ type: 'preset', id: 'b' }] }),
      },
    ]);

    expect(deduped).toHaveLength(1);
    expect(deduped[0].toolName).toBe('addElements');
    expect(JSON.parse(deduped[0].args)).toEqual({
      elements: [
        { type: 'mesh', id: 'a' },
        { type: 'preset', id: 'b' },
      ],
    });
  });

  it('preserves malformed merge payloads instead of dropping them', () => {
    const deduped = deduplicateToolCalls([
      {
        id: 'bad',
        toolName: 'addElements',
        args: '{bad json',
      },
    ]);

    expect(deduped).toHaveLength(1);
    expect(deduped[0]).toEqual({
      id: 'bad',
      toolName: 'addElements',
      args: '{bad json',
    });
  });

  it('keeps only last setSceneSettings call', () => {
    const deduped = deduplicateToolCalls([
      {
        id: 'first',
        toolName: 'setSceneSettings',
        args: JSON.stringify({ backgroundColor: '#000' }),
      },
      {
        id: 'last',
        toolName: 'setSceneSettings',
        args: JSON.stringify({ backgroundColor: '#fff' }),
      },
    ]);

    expect(deduped).toHaveLength(1);
    expect(deduped[0].id).toBe('last');
    expect(JSON.parse(deduped[0].args)).toEqual({ backgroundColor: '#fff' });
  });
});
