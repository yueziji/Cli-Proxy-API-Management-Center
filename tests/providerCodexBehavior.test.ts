import { afterEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { apiClient } from '../src/services/api/client';
import { providersApi } from '../src/services/api/providers';
import { normalizeProviderGroups } from '../src/services/api/transformers';
import type { ProviderKeyConfig } from '../src/types';
import type { ProviderBrand, ProviderResource } from '../src/features/providers/types';
import { BaseProviderForm } from '../src/features/providers/sheets/forms/BaseProviderForm';
import { compatibilityLocales } from '../src/i18n/compatibilityLocales';

const originalGet = apiClient.get;
const originalPut = apiClient.put;
afterEach(() => {
  apiClient.get = originalGet;
  apiClient.put = originalPut;
});

function backend(initialKeys: Record<string, unknown>[] = []) {
  let groups: Record<string, unknown>[] = initialKeys.length
    ? [{ name: 'fixture', 'base-url': 'https://example.invalid', keys: initialKeys }]
    : [];
  const oauth = { providers: { codex: { 'disable-codex-cloaking': true } } };
  apiClient.get = (async () => ({
    'api-keys': { codex: structuredClone(groups) },
    oauth: structuredClone(oauth),
  })) as typeof apiClient.get;
  apiClient.put = (async (path: string, value: unknown) => {
    expect(path).toBe('/config/api-keys/codex');
    groups = structuredClone(value as Record<string, unknown>[]);
  }) as typeof apiClient.put;
  return {
    rows: () => normalizeProviderGroups(groups) as ProviderKeyConfig[],
    keys: () => groups[0].keys as Record<string, unknown>[],
  };
}

describe('Codex API key behavior controls', () => {
  test.each([true, false])('creates and reads explicit %s for both fields', async (value) => {
    const state = backend();
    await providersApi.createCodexConfig({
      apiKey: 'fixture-key',
      disableCodexCloaking: value,
      streamBootstrapBuffering: value,
    });
    expect(state.keys()[0]).toEqual({
      'api-key': 'fixture-key',
      'disable-codex-cloaking': value,
      'stream-bootstrap-buffering': value,
    });
    expect(state.rows()[0]).toMatchObject({
      disableCodexCloaking: value,
      streamBootstrapBuffering: value,
    });
  });

  test('new keys keep both default values absent', async () => {
    const state = backend();
    await providersApi.createCodexConfig({ apiKey: 'fixture-key' });
    expect(state.keys()[0]).toEqual({ 'api-key': 'fixture-key' });
    expect(state.rows()[0].disableCodexCloaking).toBeUndefined();
    expect(state.rows()[0].streamBootstrapBuffering).toBeUndefined();
  });

  test('edits only the selected key and restores default by removing its overrides', async () => {
    const sibling = {
      'api-key': 'sibling',
      'disable-codex-cloaking': true,
      'stream-bootstrap-buffering': false,
    };
    const state = backend([
      {
        'api-key': 'fixture-key',
        'disable-codex-cloaking': true,
        'stream-bootstrap-buffering': true,
        future: 'keep',
      },
      sibling,
    ]);
    let row = state.rows()[0];
    await providersApi.updateCodexConfig(row.apiKey, row.baseUrl, {
      ...row,
      disableCodexCloaking: false,
      streamBootstrapBuffering: false,
    });
    expect(state.keys()[0]).toMatchObject({
      'disable-codex-cloaking': false,
      'stream-bootstrap-buffering': false,
      future: 'keep',
    });
    expect(state.keys()[1]).toEqual(sibling);
    row = state.rows()[0];
    await providersApi.updateCodexConfig(row.apiKey, row.baseUrl, {
      ...row,
      disableCodexCloaking: undefined,
      streamBootstrapBuffering: undefined,
    });
    expect(state.keys()[0]).toEqual({ 'api-key': 'fixture-key', future: 'keep' });
    expect(state.keys()[1]).toEqual(sibling);
  });

  test.each([undefined, null, false, true])(
    'unrelated edits preserve the persisted state %s',
    async (value) => {
      const key: Record<string, unknown> = { 'api-key': 'fixture-key' };
      if (value !== undefined) {
        key['disable-codex-cloaking'] = value;
        key['stream-bootstrap-buffering'] = value;
      }
      const state = backend([key]);
      const row = state.rows()[0];
      await providersApi.updateCodexConfig(row.apiKey, row.baseUrl, { ...row, weight: 5 });
      expect(state.keys()[0]).toEqual({ ...key, weight: 5 });
    }
  );
});

describe('Codex API key form', () => {
  const i18n = createInstance();
  const ready = i18n.init({
    lng: 'en',
    resources: { en: { translation: { compatibilitySettings: compatibilityLocales.en } } },
  });

  const render = (brand: ProviderBrand, raw: ProviderKeyConfig, mode: 'create' | 'edit') =>
    renderToStaticMarkup(
      createElement(
        I18nextProvider,
        { i18n },
        createElement(BaseProviderForm, {
          brand,
          mode,
          resource: mode === 'create' ? null : ({ name: 'fixture', raw } as ProviderResource),
          mutating: false,
          formId: 'fixture-form',
          onSubmit: async () => {},
        })
      )
    );

  const selection = (markup: string, field: string) => {
    const match = markup.match(new RegExp(`<button[^>]*id="[^"]*-${field}"[^>]*>(.*?)</button>`));
    expect(match).not.toBeNull();
    return match![1].replace(/<[^>]*>/g, '');
  };

  test('loads persisted values with the correct cloaking polarity and backend-support hint', async () => {
    await ready;
    const markup = render(
      'codex',
      { apiKey: 'fixture', disableCodexCloaking: true, streamBootstrapBuffering: true },
      'edit'
    );
    expect(selection(markup, 'disableCodexCloaking')).toBe('Off');
    expect(selection(markup, 'streamBootstrapBuffering')).toBe('On');
    expect(markup).toContain('requires backend support');
  });

  test('new Codex keys default to unset and other provider forms have no Codex controls', async () => {
    await ready;
    const markup = render('codex', { apiKey: '' }, 'create');
    expect(selection(markup, 'disableCodexCloaking')).toBe('Use default');
    expect(selection(markup, 'streamBootstrapBuffering')).toBe('Use default');
    for (const brand of ['claude', 'xai', 'gemini'] as const) {
      expect(render(brand, { apiKey: '' }, 'create')).not.toContain('Codex identity cloaking');
    }
  });
});
