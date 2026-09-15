import { describe, expect, test } from 'bun:test';
import type { PluginConfigField } from '../src/types';
import {
  buildPluginConfigDraft,
  buildPluginConfigPatch,
} from '../src/features/plugins/pluginConfigDraft';
import {
  configuredRetryModels,
  modelRetryFieldMode,
  modelRetryFields,
  parseRetryList,
  parseRetryNumber,
  readModelRetryOverrides,
  removeModelRetryOverride,
  setModelRetryField,
  supportsModelRetryEditor,
  validateModelRetryDraft,
} from '../src/features/plugins/modelRetryOverrides';
import { modelRetryLocales } from '../src/i18n/modelRetryLocales';

const fields: PluginConfigField[] = [
  { name: 'model_overrides', type: 'object', enumValues: [], description: '' },
];
const plugin = { id: 'model-retry-wrapper', enabled: true, configFields: fields };
const t = (key: string) => key;

describe('model retry configuration editor', () => {
  test('only enables the form for a retry plugin that declares object overrides', () => {
    expect(supportsModelRetryEditor(plugin)).toBe(true);
    expect(supportsModelRetryEditor({ ...plugin, id: 'another-plugin' })).toBe(false);
    expect(supportsModelRetryEditor({ ...plugin, configFields: [] })).toBe(false);
    expect(
      supportsModelRetryEditor({ ...plugin, configFields: [{ ...fields[0], type: 'string' }] })
    ).toBe(false);
  });

  test('offers configured names without whitespace, blank names or case duplicates', () => {
    expect(configuredRetryModels('[" Retry-A ", "retry-a", "retry-b", "", 5]')).toEqual([
      'Retry-A',
      'retry-b',
    ]);
    expect(configuredRetryModels('invalid JSON')).toEqual([]);
  });

  test('an untouched override does not enter the outgoing patch', () => {
    const draft = buildPluginConfigDraft(plugin, {
      model_overrides: { 'retry-a': { max_attempts: 3 } },
    });
    expect(buildPluginConfigPatch(draft, fields, t)).toEqual({ patch: {}, errors: {} });
  });

  test('editing one field preserves other models and unknown fields', () => {
    const original = {
      'retry-a': { max_attempts: 3, future_option: { keep: true } },
      'retry-b': { retry_keywords: ['overloaded'] },
    };
    const next = setModelRetryField(original, 'retry-a', 'initial_delay_ms', 1500);
    expect(next).toEqual({
      ...original,
      'retry-a': { ...original['retry-a'], initial_delay_ms: 1500 },
    });
    expect(original['retry-a']).not.toHaveProperty('initial_delay_ms');
    expect(setModelRetryField(next, 'retry-a', 'initial_delay_ms', undefined)).toEqual(original);
    expect(removeModelRetryOverride(next, 'retry-a')).toEqual({ 'retry-b': original['retry-b'] });
  });

  test('submits zero limits and empty lists while leaving inherited fields absent', () => {
    const draft = buildPluginConfigDraft(plugin, {});
    draft.values.model_overrides = JSON.stringify({
      'retry-a': { max_attempts: 0, max_elapsed_time_ms: 0, status_codes: [], retry_keywords: [] },
      'retry-b': { max_attempts: 1 },
    });
    draft.touchedFields.model_overrides = true;
    const result = buildPluginConfigPatch(draft, fields, t);
    expect(result.errors).toEqual({});
    expect(result.patch.model_overrides).toEqual(JSON.parse(draft.values.model_overrides));
    expect(validateModelRetryDraft(draft.values, t)).toBeNull();
  });

  test('clearing all overrides requests removal and an empty object remains an object', () => {
    const draft = buildPluginConfigDraft(plugin, {
      model_overrides: { 'retry-a': { max_attempts: 3 } },
    });
    draft.touchedFields.model_overrides = true;
    draft.values.model_overrides = '';
    expect(buildPluginConfigPatch(draft, fields, t).patch).toEqual({ model_overrides: null });
    draft.values.model_overrides = '{}';
    expect(buildPluginConfigPatch(draft, fields, t).patch).toEqual({ model_overrides: {} });
  });

  test('preserves nullable policies and treats nullable fields as inheritance', () => {
    const value = '{"retry-a":null,"retry-b":{"max_attempts":null,"retry_keywords":null}}';
    expect(readModelRetryOverrides(value)).toEqual(JSON.parse(value));
    expect(validateModelRetryDraft({ model_overrides: value }, t)).toBeNull();
    expect(setModelRetryField({ 'retry-a': null }, 'retry-a', 'max_attempts', 2)).toEqual({
      'retry-a': { max_attempts: 2 },
    });
  });

  test('distinguishes inherited, unlimited, disabled and custom modes', () => {
    for (const field of modelRetryFields) {
      expect(modelRetryFieldMode(undefined, field)).toBe('inherit');
      expect(modelRetryFieldMode(null, field)).toBe('inherit');
      expect(modelRetryFieldMode(field.kind === 'list' ? ['429'] : 3, field)).toBe('custom');
    }
    expect(modelRetryFieldMode(0, modelRetryFields[0])).toBe('unlimited');
    expect(modelRetryFieldMode([], modelRetryFields[4])).toBe('off');
  });

  test('accepts user-friendly list input without splitting multiword keywords', () => {
    expect(parseRetryList('429, 503，504\n500', 'status_codes')).toEqual([429, 503, 504, 500]);
    expect(parseRetryList('rate limited\noverloaded\n', 'retry_keywords')).toEqual([
      'rate limited',
      'overloaded',
    ]);
    expect(parseRetryNumber('3')).toBe(3);
    expect(parseRetryNumber('')).toBe('');
    expect(parseRetryNumber('1.5')).toBe('1.5');
  });

  test('rejects malformed JSON or model values without replacing their content', () => {
    for (const raw of ['{', '[]', 'null', '{"retry-a":3}', '{"retry-a":[]}']) {
      expect(readModelRetryOverrides(raw)).toBeNull();
      expect(validateModelRetryDraft({ model_overrides: raw }, t)).toBe(
        'modelRetryOverrides.invalidObject'
      );
    }
  });

  test('detects blank and normalized duplicate model keys', () => {
    expect(validateModelRetryDraft({ model_overrides: '{" ":{}}' }, t)).toBe(
      'modelRetryOverrides.blankModel'
    );
    expect(validateModelRetryDraft({ model_overrides: '{"retry-a":{}," RETRY-A ":{}}' }, t)).toBe(
      'modelRetryOverrides.duplicateModel'
    );
  });

  test('validates the effective delay pair against explicit globals and plugin defaults', () => {
    expect(
      validateModelRetryDraft({ model_overrides: '{"retry-a":{"max_delay_ms":499}}' }, t)
    ).toBe('modelRetryOverrides.delayOrder');
    expect(
      validateModelRetryDraft(
        { initial_delay_ms: '2000', model_overrides: '{"retry-a":{"max_delay_ms":1000}}' },
        t
      )
    ).toBe('modelRetryOverrides.delayOrder');
    expect(
      validateModelRetryDraft(
        { max_delay_ms: '1000', model_overrides: '{"retry-a":{"initial_delay_ms":2000}}' },
        t
      )
    ).toBe('modelRetryOverrides.delayOrder');
    expect(
      validateModelRetryDraft(
        { model_overrides: '{"retry-a":{"initial_delay_ms":20000,"max_delay_ms":30000}}' },
        t
      )
    ).toBeNull();
  });

  test('rejects invalid nested types, negative limits, unsafe integers and overflowing durations', () => {
    for (const policy of [
      { max_attempts: -1 },
      { max_attempts: 1.5 },
      { max_attempts: '3' },
      { max_attempts: 9007199254740992 },
      { initial_delay_ms: 0 },
      { max_delay_ms: 0 },
      { max_elapsed_time_ms: -1 },
      { max_elapsed_time_ms: 9300000000000 },
      { retry_keywords: 'rate_limited' },
      { retry_keywords: [1] },
      { status_codes: ['invalid'] },
      { status_codes: [600] },
    ]) {
      expect(
        validateModelRetryDraft({ model_overrides: JSON.stringify({ 'retry-a': policy }) }, t)
      ).toBe('modelRetryOverrides.invalidField');
    }
  });

  test('accepts the plugin-compatible scalar and string HTTP status formats', () => {
    for (const statusCodes of [429, '429', ['429', 503]]) {
      expect(
        validateModelRetryDraft(
          { model_overrides: JSON.stringify({ 'retry-a': { status_codes: statusCodes } }) },
          t
        )
      ).toBeNull();
    }
  });

  test('model names that are object property names remain ordinary JSON keys', () => {
    const original = readModelRetryOverrides('{"__proto__":{"max_attempts":3},"constructor":{}}')!;
    const next = setModelRetryField(original, '__proto__', 'initial_delay_ms', 1000);
    expect(JSON.parse(JSON.stringify(next))).toEqual(
      JSON.parse('{"__proto__":{"max_attempts":3,"initial_delay_ms":1000},"constructor":{}}')
    );
    expect(Object.prototype).not.toHaveProperty('max_attempts');
  });

  test('all supported languages expose the same editor messages', () => {
    const expected = Object.keys(modelRetryLocales['zh-CN']).sort();
    for (const locale of Object.values(modelRetryLocales))
      expect(Object.keys(locale).sort()).toEqual(expected);
  });
});
