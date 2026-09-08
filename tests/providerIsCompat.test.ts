import { afterEach, describe, expect, test } from 'bun:test';
import { apiClient } from '../src/services/api/client';
import { providersApi } from '../src/services/api/providers';
import { normalizeModelAliases } from '../src/services/api/transformers';
import type { ModelAlias, ProviderKeyConfig } from '../src/types';

const originalGet = apiClient.get;
const originalPut = apiClient.put;
afterEach(() => {
  apiClient.get = originalGet;
  apiClient.put = originalPut;
});

const keyCases = [
  ['gemini-api-key', providersApi.createGeminiKey, providersApi.updateGeminiKey],
  ['interactions-api-key', providersApi.createInteractionsKey, providersApi.updateInteractionsKey],
  ['codex-api-key', providersApi.createCodexConfig, providersApi.updateCodexConfig],
  ['xai-api-key', providersApi.createXAIConfig, providersApi.updateXAIConfig],
  ['claude-api-key', providersApi.createClaudeConfig, providersApi.updateClaudeConfig],
] as const;

describe('model is-compat management contract', () => {
  test('reads true, false and omitted values without treating strings as booleans', () => {
    expect(
      normalizeModelAliases([
        { name: 'enabled', 'is-compat': true },
        { name: 'disabled', 'is-compat': false },
        { name: 'default' },
        { name: 'invalid', 'is-compat': 'false' },
      ])
    ).toEqual([
      { name: 'enabled', isCompat: true },
      { name: 'disabled', isCompat: false },
      { name: 'default' },
      { name: 'invalid' },
    ]);
  });

  for (const [section, create, update] of keyCases) {
    test(`${section}: creates compatible models and can disable them without losing unknown fields`, async () => {
      let records: unknown[] = [];
      apiClient.get = (async () => ({ [section]: records })) as typeof apiClient.get;
      apiClient.put = (async (url: string, data: unknown) => {
        expect(url).toBe(`/${section}`);
        records = data as unknown[];
      }) as typeof apiClient.put;

      const config: ProviderKeyConfig = {
        apiKey: 'test-placeholder',
        models: [{ name: 'upstream-model', isCompat: true }],
      };
      await create(config);
      expect(records).toEqual([
        {
          'api-key': 'test-placeholder',
          models: [{ name: 'upstream-model', 'is-compat': true }],
        },
      ]);

      records = [
        {
          'api-key': 'test-placeholder',
          'future-provider-option': true,
          models: [{ name: 'upstream-model', 'is-compat': true, 'future-model-option': 123 }],
        },
      ];
      await update('test-placeholder', undefined, {
        ...config,
        models: [{ name: 'upstream-model', isCompat: false }],
      });
      expect(records).toEqual([
        {
          'api-key': 'test-placeholder',
          'future-provider-option': true,
          models: [{ name: 'upstream-model', 'is-compat': false, 'future-model-option': 123 }],
        },
      ]);
    });
  }

  test('OpenAI-compatible models retain their individual values when reordered and saved', async () => {
    const rawModels = [
      { name: 'first', 'is-compat': true, image: true, 'future-option': 'first' },
      { name: 'second', 'is-compat': false, 'future-option': 'second' },
    ];
    let saved: unknown;
    apiClient.get = (async () => ({
      'openai-compatibility': [{ name: 'test-provider', models: rawModels }],
    })) as typeof apiClient.get;
    apiClient.put = (async (_url: string, data: unknown) => {
      saved = data;
    }) as typeof apiClient.put;
    const models = normalizeModelAliases(rawModels).reverse();
    models[1].isCompat = false;
    await providersApi.updateOpenAIProvider('test-provider', 0, {
      name: 'test-provider',
      baseUrl: 'https://example.com/v1',
      apiKeyEntries: [],
      models,
    });
    expect(saved).toEqual([
      {
        name: 'test-provider',
        'base-url': 'https://example.com/v1',
        'api-key-entries': [],
        models: [
          { name: 'second', 'is-compat': false, 'future-option': 'second' },
          { name: 'first', 'is-compat': false, image: true, 'future-option': 'first' },
        ],
      },
    ]);
  });

  test('new OpenAI-compatible providers save enabled and default models', async () => {
    let saved: unknown;
    apiClient.get = (async () => ({})) as typeof apiClient.get;
    apiClient.put = (async (_url: string, data: unknown) => {
      saved = data;
    }) as typeof apiClient.put;
    await providersApi.createOpenAIProvider({
      name: 'test-provider',
      baseUrl: 'https://example.com/v1',
      apiKeyEntries: [],
      models: [{ name: 'enabled', isCompat: true }, { name: 'default' }],
    });
    expect(saved).toEqual([
      {
        name: 'test-provider',
        'base-url': 'https://example.com/v1',
        'api-key-entries': [],
        models: [{ name: 'enabled', 'is-compat': true }, { name: 'default' }],
      },
    ]);
  });

  test('Vertex does not serialize the unsupported flag', async () => {
    let saved: unknown;
    apiClient.get = (async () => ({})) as typeof apiClient.get;
    apiClient.put = (async (_url: string, data: unknown) => {
      saved = data;
    }) as typeof apiClient.put;
    const model: ModelAlias = { name: 'vertex-model', alias: 'alias', isCompat: true };
    await providersApi.createVertexConfig({ apiKey: 'test-placeholder', models: [model] });
    expect(saved).toEqual([
      {
        'api-key': 'test-placeholder',
        models: [{ name: 'vertex-model', alias: 'alias' }],
      },
    ]);
  });

  test('omitted values preserve a flag added to the latest config', async () => {
    let saved: unknown;
    apiClient.get = (async () => ({
      'codex-api-key': [
        {
          'api-key': 'test-placeholder',
          models: [{ name: 'model', 'is-compat': true }],
        },
      ],
    })) as typeof apiClient.get;
    apiClient.put = (async (_url: string, data: unknown) => {
      saved = data;
    }) as typeof apiClient.put;
    await providersApi.updateCodexConfig('test-placeholder', undefined, {
      apiKey: 'test-placeholder',
      models: [{ name: 'model' }],
    });
    expect(saved).toEqual([
      {
        'api-key': 'test-placeholder',
        models: [{ name: 'model', 'is-compat': true }],
      },
    ]);
  });
});
