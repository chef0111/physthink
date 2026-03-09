function readQuotedString(
  s: string,
  i: number,
  quote: string
): [string, number] {
  i++; // skip opening quote
  let result = '';
  while (i < s.length) {
    if (s[i] === '\\' && i + 1 < s.length) {
      result += s[i + 1];
      i += 2;
    } else if (s[i] === quote) {
      return [result, i + 1];
    } else {
      result += s[i++];
    }
  }
  return [result, i];
}

function readBracketedValue(s: string, i: number): [unknown, number] {
  const start = i;
  let depth = 0;
  let inStr = false;
  let strChar = '';

  while (i < s.length) {
    const ch = s[i];

    if (inStr) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === strChar) inStr = false;
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inStr = true;
      strChar = ch;
      i++;
      continue;
    }

    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) {
        const json = s.substring(start, i + 1);
        try {
          return [JSON.parse(json), i + 1];
        } catch {
          return [json, i + 1];
        }
      }
    }
    i++;
  }

  // Incomplete bracket — return as-is
  const json = s.substring(start, i);
  try {
    return [JSON.parse(json), i];
  } catch {
    return [json, i];
  }
}

function readValue(s: string, i: number): [unknown, number] {
  if (i >= s.length) return ['', i];

  const ch = s[i];

  // Quoted string
  if (ch === '"' || ch === "'") {
    return readQuotedString(s, i, ch);
  }

  // JSON object or array
  if (ch === '{' || ch === '[') {
    return readBracketedValue(s, i);
  }

  // Boolean / number / bare word — read until comma or end
  let raw = '';
  while (i < s.length && s[i] !== ',') raw += s[i++];
  raw = raw.trim();

  if (/^true$/i.test(raw)) return [true, i];
  if (/^false$/i.test(raw)) return [false, i];
  if (raw === 'None' || raw === 'null') return [null, i];
  if (/^-?\d+(\.\d+)?$/.test(raw)) return [parseFloat(raw), i];
  return [raw, i];
}

function parseKeyValueArgs(s: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let i = 0;

  while (i < s.length) {
    while (i < s.length && s[i] === ' ') i++;
    if (i >= s.length) break;

    let key = '';
    while (i < s.length && s[i] !== '=') key += s[i++];
    key = key.trim();
    if (i >= s.length || !key) break;
    i++; // skip '='

    while (i < s.length && s[i] === ' ') i++;

    const [value, nextI] = readValue(s, i);
    result[key] = value;
    i = nextI;

    while (i < s.length && (s[i] === ',' || s[i] === ' ')) i++;
  }

  return result;
}

/**
 * Parse a JSON tool call from <tool_call> tag content:
 *   {"name":"toolName","arguments":{"key":"value"}}
 */
export function parseToolCallJson(
  s: string
): { name: string; arguments?: Record<string, unknown> } | null {
  try {
    const json = JSON.parse(s);
    if (typeof json.name === 'string') return json;
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse a single function-call line:
 *   toolName(key="value", key2=123, key3={"a":1})
 */
export function parseFnCallLine(
  line: string
): { toolName: string; args: Record<string, unknown> } | null {
  const parenIdx = line.indexOf('(');
  if (parenIdx < 0 || !line.endsWith(')')) return null;

  const toolName = line.substring(0, parenIdx).trim();
  if (!toolName || !/^\w+$/.test(toolName)) return null;

  const inner = line.substring(parenIdx + 1, line.length - 1).trim();
  if (!inner) return { toolName, args: {} };

  return { toolName, args: parseKeyValueArgs(inner) };
}
