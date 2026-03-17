import { describe, expect, it } from 'vitest';
import { parseFnCallLine, parseToolCallJson } from './parsers';

describe('fn-call parsers', () => {
  it('parses canonical tagged JSON payload', () => {
    const parsed = parseToolCallJson(
      '{"name":"addElements","arguments":{"elements":[{"type":"mesh"}]}}'
    );

    expect(parsed).toEqual({
      name: 'addElements',
      arguments: { elements: [{ type: 'mesh' }] },
    });
  });

  it('returns null for malformed JSON payload', () => {
    const parsed = parseToolCallJson('{"name": "addElements", bad json');
    expect(parsed).toBeNull();
  });

  it('parses FN_CALL fallback line with mixed argument types', () => {
    const parsed = parseFnCallLine(
      'addElements(elements=[{"type":"preset"}], dryRun=false, topK=5)'
    );

    expect(parsed?.toolName).toBe('addElements');
    expect(parsed?.args).toEqual({
      elements: [{ type: 'preset' }],
      dryRun: false,
      topK: 5,
    });
  });

  it('returns null for invalid fallback line', () => {
    expect(parseFnCallLine('not a call')).toBeNull();
  });
});
