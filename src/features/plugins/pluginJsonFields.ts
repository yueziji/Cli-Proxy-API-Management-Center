import { isRecord } from '@/utils/helpers';

export type PluginJsonFieldType = 'array' | 'object';
export type PluginJsonValueType = 'string' | 'number' | 'boolean' | 'null';

export interface PluginJsonRow {
  id: string;
  name: string;
  type: PluginJsonValueType;
  value: string;
}

interface JsonFieldInspection {
  rows: PluginJsonRow[] | null;
  error: string | null;
}

// Tokenize only after JSON.parse has checked the syntax. Keeping the original
// tokens avoids rounding numbers or losing duplicate keys when formatting JSON.
const jsonTokens = (text: string): string[] =>
  text.match(/"(?:[^"\\]|\\.)*"|[{}[\],:]|[^\s{}[\],:]+/g) ?? [];

export function isEditableJsonNumber(text: string): boolean {
  if (!/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(text.trim())) return false;
  const value = Number(text);
  return Number.isFinite(value) && (!Number.isInteger(value) || Number.isSafeInteger(value));
}

export function inspectPluginJsonField(
  text: string,
  fieldType: PluginJsonFieldType
): JsonFieldInspection {
  if (!text.trim()) return { rows: [], error: null };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { rows: null, error: 'plugin_management.invalid_json' };
  }
  if (fieldType === 'array' ? !Array.isArray(parsed) : !isRecord(parsed)) {
    return { rows: null, error: `plugin_management.expected_${fieldType}` };
  }

  const tokens = jsonTokens(text).slice(1, -1);
  if (tokens.some((token) => ['{', '}', '[', ']'].includes(token))) {
    return { rows: null, error: null };
  }

  const rows: PluginJsonRow[] = [];
  const names = new Set<string>();
  const step = fieldType === 'array' ? 2 : 4;
  for (let index = 0; index < tokens.length; index += step) {
    const name = fieldType === 'object' ? (JSON.parse(tokens[index]) as string) : '';
    if (fieldType === 'object' && names.has(name)) return { rows: null, error: null };
    names.add(name);
    const token = tokens[index + (fieldType === 'object' ? 2 : 0)];
    const value: unknown = JSON.parse(token);
    const type = value === null ? 'null' : (typeof value as PluginJsonValueType);
    if (type === 'number' && !isEditableJsonNumber(token)) return { rows: null, error: null };
    rows.push({
      id: `entry-${rows.length}`,
      name,
      type,
      value: type === 'string' ? (value as string) : token,
    });
  }
  return { rows, error: null };
}

export function serializePluginJsonRows(
  rows: PluginJsonRow[],
  fieldType: PluginJsonFieldType
): { text: string; invalidNumber: number | null } {
  const invalidNumber = rows.findIndex(
    (row) => row.type === 'number' && !isEditableJsonNumber(row.value)
  );
  if (invalidNumber !== -1) return { text: '', invalidNumber };

  const values = rows.map((row) => {
    const value = row.type === 'string' ? JSON.stringify(row.value) : row.value.trim();
    return fieldType === 'object' ? `${JSON.stringify(row.name)}: ${value}` : value;
  });
  const [open, close] = fieldType === 'array' ? ['[', ']'] : ['{', '}'];
  return {
    text: values.length ? `${open}\n  ${values.join(',\n  ')}\n${close}` : `${open}${close}`,
    invalidNumber: null,
  };
}

export function formatPluginJson(text: string): string | null {
  try {
    JSON.parse(text);
  } catch {
    return null;
  }

  const tokens = jsonTokens(text);
  let depth = 0;
  let formatted = '';
  const newline = () => `\n${'  '.repeat(depth)}`;
  tokens.forEach((token, index) => {
    if (token === '{' || token === '[') {
      formatted += token;
      if (tokens[index + 1] !== (token === '{' ? '}' : ']')) {
        depth++;
        formatted += newline();
      }
    } else if (token === '}' || token === ']') {
      if (tokens[index - 1] !== (token === '}' ? '{' : '[')) {
        depth--;
        formatted += newline();
      }
      formatted += token;
    } else if (token === ',') {
      formatted += `,${newline()}`;
    } else if (token === ':') {
      formatted += ': ';
    } else {
      formatted += token;
    }
  });
  return formatted;
}
