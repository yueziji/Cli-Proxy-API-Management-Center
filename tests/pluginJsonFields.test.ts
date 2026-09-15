import { describe, expect, test } from 'bun:test';
import {
  formatPluginJson,
  inspectPluginJsonField,
  isEditableJsonNumber,
  serializePluginJsonRows,
} from '../src/features/plugins/pluginJsonFields';
import {
  buildPluginConfigDraft,
  buildPluginConfigPatch,
} from '../src/features/plugins/pluginConfigDraft';
import { pluginJsonLocales } from '../src/i18n/pluginJsonLocales';

describe('generic plugin JSON fields', () => {
  test('edits arbitrary primitive arrays without coercing strings, booleans or null', () => {
    const rows = inspectPluginJsonField('["001", 0, false, null, "a\\nb", 1.20e2]', 'array').rows!;
    expect(rows.map(({ type }) => type)).toEqual([
      'string',
      'number',
      'boolean',
      'null',
      'string',
      'number',
    ]);
    rows[0].value = '002';
    const result = serializePluginJsonRows(rows, 'array');
    expect(result.invalidNumber).toBeNull();
    expect(JSON.parse(result.text)).toEqual(['002', 0, false, null, 'a\nb', 120]);
    expect(result.text).toContain('1.20e2');
  });

  test('edits a flat object while preserving unrelated fields and literal property names', () => {
    const original = '{"timeout":30,"enabled":true,"__proto__":"keep","constructor":null,"":false}';
    const rows = inspectPluginJsonField(original, 'object').rows!;
    rows[0].value = '45';
    const result = serializePluginJsonRows(rows, 'object');
    expect(JSON.parse(result.text)).toEqual(JSON.parse(original.replace('30', '45')));
    expect(Object.prototype).not.toHaveProperty('timeout');
  });

  test('removing an array row keeps the remaining order and types', () => {
    const rows = inspectPluginJsonField('["first",false,12,null]', 'array').rows!;
    const result = serializePluginJsonRows(
      rows.filter((_, index) => index !== 1),
      'array'
    );
    expect(JSON.parse(result.text)).toEqual(['first', 12, null]);
  });

  test('invalid or unfinished numbers cannot serialize a different type', () => {
    for (const value of [
      '',
      '-',
      '1.',
      '1e',
      '01',
      'null',
      'true',
      '"3"',
      '1e400',
      '9007199254740993',
    ]) {
      const rows = inspectPluginJsonField('{"timeout":30}', 'object').rows!;
      rows[0].value = value;
      expect(serializePluginJsonRows(rows, 'object').invalidNumber).toBe(0);
    }
    for (const value of ['0', '-0', '1.25', '-3e-2', '9007199254740991']) {
      expect(isEditableJsonNumber(value)).toBe(true);
    }
  });

  test('keeps nested values, duplicate names and large numbers in JSON mode', () => {
    for (const value of [
      '{"nested":{"enabled":true}}',
      '{"items":[]}',
      '{"a":1,"a":2}',
      '{"a":{"b":1},"a":2}',
      '{"limit":9007199254740993}',
      '{"limit":1e400}',
    ]) {
      expect(inspectPluginJsonField(value, 'object')).toEqual({ rows: null, error: null });
    }
    expect(inspectPluginJsonField('[1,{"value":2}]', 'array').rows).toBeNull();
  });

  test('brackets, commas and escaped quotes inside strings do not look like nested values', () => {
    const value = { '"name:[]': 'a, [b] {c} "quoted" \\ path\nnext' };
    const rows = inspectPluginJsonField(JSON.stringify(value), 'object').rows!;
    expect(rows).toHaveLength(1);
    expect(JSON.parse(serializePluginJsonRows(rows, 'object').text)).toEqual(value);
  });

  test('reports invalid syntax and incorrect root types without inventing form data', () => {
    expect(inspectPluginJsonField('{', 'object')).toEqual({
      rows: null,
      error: 'plugin_management.invalid_json',
    });
    expect(inspectPluginJsonField('{}', 'array').error).toBe('plugin_management.expected_array');
    for (const value of ['[]', 'null', 'false', '3', '"text"']) {
      expect(inspectPluginJsonField(value, 'object').error).toBe(
        'plugin_management.expected_object'
      );
    }
    expect(formatPluginJson('{')).toBeNull();
  });

  test('formatting nested JSON preserves exact numeric tokens, key order and duplicate keys', () => {
    const raw = String.raw`{"2":1e+2,"1":-0,"big":9007199254740993,"x":1,"x":2,"nested":[{},[],{"text":"a,\n\"b"}]}`;
    const formatted = formatPluginJson(raw)!;
    expect(formatted).toContain('"big": 9007199254740993');
    expect(formatted).toContain('"1": -0');
    expect(formatted).toContain('"2": 1e+2');
    expect(formatted.indexOf('"2"')).toBeLessThan(formatted.indexOf('"1"'));
    expect(formatted).toContain('"x": 1,\n  "x": 2');
    expect(JSON.parse(formatted)).toEqual(JSON.parse(raw));
    expect(formatPluginJson(formatted)).toBe(formatted);
  });

  test('opening and switching views does not initialize unset fields or create a patch', () => {
    const field = { name: 'options', type: 'object', enumValues: [], description: '' };
    const plugin = { enabled: true, configFields: [field] };
    const draft = buildPluginConfigDraft(plugin, {});
    expect(inspectPluginJsonField(String(draft.values.options), 'object').rows).toEqual([]);
    expect(buildPluginConfigPatch(draft, [field], (key) => key)).toEqual({ patch: {}, errors: {} });
    expect(draft.values.options).toBe('');
  });

  test('empty collections, unset fields and nested null values remain distinct on save', () => {
    for (const type of ['array', 'object'] as const) {
      const field = { name: 'options', type, enumValues: [], description: '' };
      const draft = buildPluginConfigDraft({ enabled: true, configFields: [field] }, {});
      draft.touchedFields.options = true;
      draft.values.options = serializePluginJsonRows([], type).text;
      expect(buildPluginConfigPatch(draft, [field], (key) => key).patch.options).toEqual(
        type === 'array' ? [] : {}
      );
      draft.values.options = '';
      expect(buildPluginConfigPatch(draft, [field], (key) => key).patch.options).toBeNull();
    }
    const rows = inspectPluginJsonField('{"optional":null}', 'object').rows!;
    expect(JSON.parse(serializePluginJsonRows(rows, 'object').text)).toEqual({ optional: null });
  });

  test('an unfinished form value blocks saving the previous valid configuration', () => {
    const field = { name: 'options', type: 'object', enumValues: [], description: '' };
    const draft = buildPluginConfigDraft(
      { enabled: true, configFields: [field] },
      { options: { timeout: 30 } }
    );
    draft.touchedFields.options = true;
    draft.editorErrors.options = 'Finish the number';
    expect(buildPluginConfigPatch(draft, [field], (key) => key)).toEqual({
      patch: {},
      errors: { options: 'Finish the number' },
    });
    draft.editorErrors.options = '';
    draft.values.options = '{"timeout":45}';
    expect(buildPluginConfigPatch(draft, [field], (key) => key)).toEqual({
      patch: { options: { timeout: 45 } },
      errors: {},
    });
  });

  test('every supported language includes the same editor labels', () => {
    const keys = Object.keys(pluginJsonLocales.en).sort();
    for (const locale of Object.values(pluginJsonLocales)) {
      expect(Object.keys(locale).sort()).toEqual(keys);
    }
  });
});
