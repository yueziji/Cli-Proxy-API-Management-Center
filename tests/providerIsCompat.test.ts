import { afterEach, describe, expect, test } from 'bun:test';
import { apiClient } from '../src/services/api/client';
import { providersApi, type ProviderFamily } from '../src/services/api/providers';
import { normalizeModelAliases, normalizeProviderGroups } from '../src/services/api/transformers';
import type { ModelAlias, OpenAIProviderConfig, ProviderKeyConfig } from '../src/types';

const originalGet = apiClient.get;
const originalPut = apiClient.put;
afterEach(() => {
  apiClient.get = originalGet;
  apiClient.put = originalPut;
});

function backend(family: ProviderFamily, groups: Record<string, unknown>[] = []) {
  let state = structuredClone(groups);
  apiClient.get = (async () => ({
    'api-keys': { [family]: structuredClone(state) },
  })) as typeof apiClient.get;
  apiClient.put = (async (url: string, data: unknown) => {
    expect(url).toBe('/config/api-keys/' + family);
    state = data as Record<string, unknown>[];
  }) as typeof apiClient.put;
  return () => state;
}

const keyCases = [
  ['gemini', providersApi.createGeminiKey, providersApi.updateGeminiKey],
  ['interactions', providersApi.createInteractionsKey, providersApi.updateInteractionsKey],
  ['codex', providersApi.createCodexConfig, providersApi.updateCodexConfig],
  ['xai', providersApi.createXAIConfig, providersApi.updateXAIConfig],
  ['claude', providersApi.createClaudeConfig, providersApi.updateClaudeConfig],
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
      { sourceIndex: 0, name: 'enabled', isCompat: true },
      { sourceIndex: 1, name: 'disabled', isCompat: false },
      { sourceIndex: 2, name: 'default' },
      { sourceIndex: 3, name: 'invalid' },
    ]);
  });

  for (const [family, create, update] of keyCases) {
    test(
      family + ': creates compatible models and can disable them without losing unknown fields',
      async () => {
        const created = backend(family);
        const config: ProviderKeyConfig = {
          apiKey: 'test-placeholder',
          models: [{ name: 'upstream-model', isCompat: true }],
        };
        await create(config);
        expect(created()).toEqual([
          {
            name: family + '-1',
            keys: [
              {
                'api-key': 'test-placeholder',
                models: [{ name: 'upstream-model', 'is-compat': true }],
              },
            ],
          },
        ]);

        const groups = [
          {
            name: 'fixture',
            keys: [
              {
                'api-key': 'test-placeholder',
                'future-provider-option': true,
                models: [{ name: 'upstream-model', 'is-compat': true, 'future-model-option': 123 }],
              },
            ],
          },
        ];
        const saved = backend(family, groups);
        const [row] = normalizeProviderGroups(groups) as ProviderKeyConfig[];
        await update(row.apiKey, undefined, {
          ...row,
          models: [{ ...row.models![0], isCompat: false }],
        });
        expect(saved()).toEqual([
          {
            name: 'fixture',
            keys: [
              {
                'api-key': 'test-placeholder',
                'future-provider-option': true,
                models: [
                  { name: 'upstream-model', 'is-compat': false, 'future-model-option': 123 },
                ],
              },
            ],
          },
        ]);
      }
    );
  }

  test('OpenAI-compatible models retain their individual values when reordered and saved', async () => {
    const rawModels = [
      { name: 'first', 'is-compat': true, image: true, 'future-option': 'first' },
      { name: 'second', 'is-compat': false, 'future-option': 'second' },
    ];
    const groups = [
      {
        name: 'test-provider',
        'base-url': 'https://example.com/v1',
        keys: [],
        models: rawModels,
      },
    ];
    const saved = backend('openai-compatibility', groups);
    const [row] = normalizeProviderGroups(groups, true) as OpenAIProviderConfig[];
    const models = [...row.models!].reverse();
    models[1] = { ...models[1], isCompat: false };
    await providersApi.updateOpenAIProvider(row.name, 0, { ...row, models });
    expect(saved()).toEqual([
      {
        ...groups[0],
        models: [
          { name: 'second', 'is-compat': false, 'future-option': 'second' },
          { name: 'first', 'is-compat': false, image: true, 'future-option': 'first' },
        ],
      },
    ]);
  });

  test('new OpenAI-compatible providers save enabled and default models', async () => {
    const saved = backend('openai-compatibility');
    await providersApi.createOpenAIProvider({
      name: 'test-provider',
      baseUrl: 'https://example.com/v1',
      apiKeyEntries: [],
      models: [{ name: 'enabled', isCompat: true }, { name: 'default' }],
    });
    expect(saved()).toEqual([
      {
        name: 'test-provider',
        'base-url': 'https://example.com/v1',
        keys: [],
        models: [{ name: 'enabled', 'is-compat': true }, { name: 'default' }],
      },
    ]);
  });

  test('Vertex does not serialize the unsupported flag', async () => {
    const saved = backend('vertex');
    const model: ModelAlias = { name: 'vertex-model', alias: 'alias', isCompat: true };
    await providersApi.createVertexConfig({ apiKey: 'test-placeholder', models: [model] });
    expect(saved()).toEqual([
      {
        name: 'vertex-1',
        keys: [
          {
            'api-key': 'test-placeholder',
            models: [{ name: 'vertex-model', alias: 'alias' }],
          },
        ],
      },
    ]);
  });

  test('omitted values preserve a flag added to the latest config', async () => {
    const groups = [
      {
        name: 'fixture',
        keys: [
          {
            'api-key': 'test-placeholder',
            models: [{ name: 'model', 'is-compat': true }],
          },
        ],
      },
    ];
    const saved = backend('codex', groups);
    await providersApi.updateCodexConfig('test-placeholder', undefined, {
      apiKey: 'test-placeholder',
      models: [{ name: 'model' }],
    });
    expect(saved()).toEqual(groups);
  });
});
