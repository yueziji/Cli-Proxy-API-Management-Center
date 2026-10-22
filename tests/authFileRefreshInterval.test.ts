import { describe, expect, test } from 'bun:test';
import {
  applyForkAuthFilePreview,
  extendAuthFileFieldsPatch,
  readForkAuthFileEditorState,
  updateForkAuthFileEditorState,
} from '../src/features/authFiles/authFileEditorState';
import type { AuthFileFieldsPatch } from '../src/services/api/authFiles';
import {
  buildAuthFileFieldsPatch,
  type PrefixProxyEditorState,
} from '../src/features/authFiles/hooks/useAuthFilesPrefixProxyEditor';

const errorKey = (key: string) => key;
const read = (json: Record<string, unknown>) => readForkAuthFileEditorState(json, errorKey);
function edit(json: Record<string, unknown>, value: string) {
  const state = updateForkAuthFileEditorState(
    { ...read(json), json },
    'refreshInterval',
    value,
    errorKey
  )!;
  const patch: AuthFileFieldsPatch = {};
  extendAuthFileFieldsPatch(state, patch, errorKey);
  return patch;
}

describe('auth-file refresh interval backend contract', () => {
  test('reads the first positive value in backend alias order', () => {
    const metadata = {
      refresh_interval_seconds: 300,
      refreshIntervalSeconds: 600,
      refresh_interval: '1h',
      refreshInterval: '2h',
    };
    expect(read(metadata).refreshInterval).toBe('300');
    expect(read({ ...metadata, refresh_interval_seconds: 0 }).refreshInterval).toBe('600');
    expect(
      read({ ...metadata, refresh_interval_seconds: null, refreshIntervalSeconds: 'invalid' })
        .refreshInterval
    ).toBe('1h');
  });

  test.each([
    'refresh_interval_seconds',
    'refreshIntervalSeconds',
    'refresh_interval',
    'refreshInterval',
  ])('%s accepts numeric seconds and preserves untouched values', (key) => {
    const json = { [key]: 300, note: 'keep' };
    expect(read(json).refreshInterval).toBe('300');
    const patch: AuthFileFieldsPatch = {};
    extendAuthFileFieldsPatch({ ...read(json), json }, patch, errorKey);
    expect(patch).toEqual({});
    expect(edit(json, '300')).toEqual({});
    const changed = edit(json, '1h');
    expect(read({ ...json, ...changed }).refreshInterval).toBe('1h');
    const cleared = edit(json, '');
    expect(read({ ...json, ...cleared }).refreshInterval).toBe('');
  });

  test('changes and clears all present aliases while preview matches metadata PATCH', () => {
    const json = {
      refresh_interval_seconds: 300,
      refreshIntervalSeconds: 600,
      refresh_interval: '1h',
      refreshInterval: '2h',
      note: 'keep',
    };
    for (const value of ['15m', '']) {
      const patch = edit(json, value);
      expect(patch).toEqual({
        refresh_interval: value || null,
        refresh_interval_seconds: null,
        refreshIntervalSeconds: null,
        refreshInterval: null,
      });
      expect(applyForkAuthFilePreview({ ...json }, patch)).toEqual({ ...json, ...patch });
      expect(read({ ...json, ...patch }).refreshInterval).toBe(value);
    }
  });

  test.each(['300', '0.5', '3e2', '15m', '1h30m', '.5s', '1µs', '+1s'])(
    'accepts a positive backend duration: %s',
    (value) => expect(edit({}, value)).toEqual({ refresh_interval: value })
  );

  test.each(['0', '0s', '-1', '-1s', '1d', 'NaN', 'Infinity', '999999999999h', '1e100', '0.1ns'])(
    'rejects invalid, zero or overflowing durations: %s',
    (value) => expect(() => edit({}, value)).toThrow('auth_files.refresh_interval_invalid')
  );
});

describe('fork auth-file fields', () => {
  const makeEditor = (json: Record<string, unknown>): PrefixProxyEditorState => ({
    fileName: 'credential.json',
    fileInfoText: '',
    loading: false,
    saving: false,
    error: null,
    originalText: JSON.stringify(json),
    rawText: JSON.stringify(json),
    invalidContentPreview: '',
    json,
    providerKey: 'codex',
    prefix: '',
    proxyUrl: '',
    priority: '',
    weight: '',
    weightError: null,
    disableCooling: false,
    disableCoolingTouched: false,
    websockets: false,
    websocketsTouched: false,
    useSiwc: false,
    useSiwcTouched: false,
    usingApi: false,
    usingApiTouched: false,
    note: '',
    noteTouched: false,
    excludedModelsText: '',
    excludedModelsTouched: false,
    headersText: '',
    headersTouched: false,
    headersError: null,
    ...read(json),
  });

  test('reads legacy refresh aliases', () => {
    expect(read({ refreshIntervalSeconds: 900 })).toMatchObject({
      refreshInterval: '900',
      refreshIntervalError: null,
    });
  });

  test('adds only touched fork fields to the patch', () => {
    const editor = {
      ...makeEditor({ refresh_interval: '5m', disable_cooling: true }),
      refreshInterval: '15m',
      refreshIntervalTouched: true,
      disableCooling: false,
      disableCoolingTouched: true,
    };

    expect(buildAuthFileFieldsPatch(editor, errorKey)).toEqual({
      refresh_interval: '15m',
      disable_cooling: false,
    });
  });

  test('rejects an invalid refresh interval before PATCH', () => {
    const editor = {
      ...makeEditor({}),
      refreshInterval: 'invalid',
      refreshIntervalTouched: true,
    };

    expect(() => buildAuthFileFieldsPatch(editor, errorKey)).toThrow(
      'auth_files.refresh_interval_invalid'
    );
  });
});
