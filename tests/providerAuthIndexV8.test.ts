import { afterEach, describe, expect, test } from 'bun:test';
import { apiClient } from '@/services/api/client';
import { providersApi } from '@/services/api/providers';
import {
  normalizeApiKeyEntry,
  normalizeGeminiKeyConfig,
  normalizeProviderKeyConfig,
  normalizeProviderGroups,
  normalizeOpenAIProvider,
} from '@/services/api/transformers';
import { withoutProviderAuthIndexes } from '@/services/api/providerMetadata';
import type { ProviderKeyConfig, OpenAIProviderConfig } from '@/types';

const originalGet = apiClient.get;
const originalPut = apiClient.put;
afterEach(() => {
  apiClient.get = originalGet;
  apiClient.put = originalPut;
});

function backend(family: string, groups: Record<string, unknown>[]) {
  const writes: unknown[] = [];
  apiClient.get = (async () => ({
    'api-keys': { [family]: structuredClone(groups) },
  })) as typeof apiClient.get;
  apiClient.put = (async (url, payload) => {
    expect(url).toBe(`/config/api-keys/${family}`);
    writes.push(payload);
  }) as typeof apiClient.put;
  return writes;
}

describe('v8 API-key auth indexes', () => {
  for (const spelling of ['auth_index', 'auth-index']) {
    test(`reads ${spelling} for provider keys and OpenAI compatibility groups`, () => {
      const key = { 'api-key': 'synthetic-key', [spelling]: 'live-index' };
      for (const normalize of [
        normalizeApiKeyEntry,
        normalizeGeminiKeyConfig,
        normalizeProviderKeyConfig,
      ]) {
        expect(normalize(key)?.authIndex).toBe('live-index');
      }
      const group = { name: 'fixture', 'base-url': 'https://example.invalid', keys: [key] };
      expect((normalizeProviderGroups([group])[0] as ProviderKeyConfig).authIndex).toBe(
        'live-index'
      );
      expect(
        (normalizeProviderGroups([group], true)[0] as OpenAIProviderConfig).apiKeyEntries[0]
          .authIndex
      ).toBe('live-index');
      expect(
        normalizeOpenAIProvider({ ...group, keys: [], [spelling]: 'group-index' })?.authIndex
      ).toBe('group-index');
    });
  }

  test('canonical index wins and numeric zero is retained', () => {
    expect(
      normalizeProviderKeyConfig({ 'api-key': 'synthetic', auth_index: 0, 'auth-index': 'old' })
        ?.authIndex
    ).toBe('0');
  });

  test('strips only metadata positions without mutating snapshots or user-owned nested values', () => {
    const group = {
      name: 'fixture',
      auth_index: 'group-live',
      'auth-index': 'old-group',
      headers: { auth_index: 'user-header', 'auth-index': 'other-header' },
      models: [{ name: 'model', auth_index: 'user-model-field' }],
      keys: [
        {
          'api-key': 'synthetic',
          auth_index: 'live',
          'auth-index': 'old',
          headers: { auth_index: 'keep' },
        },
      ],
    };
    const copy = structuredClone(group);
    expect(withoutProviderAuthIndexes(group)).toEqual({
      name: group.name,
      headers: group.headers,
      models: group.models,
      keys: [{ 'api-key': 'synthetic', headers: { auth_index: 'keep' } }],
    });
    expect(group).toEqual(copy);
  });

  test('an index refresh does not cause a false concurrency conflict or leak sibling metadata into writes', async () => {
    const group = {
      name: 'fixture',
      keys: [
        {
          'api-key': 'synthetic-a',
          auth_index: 'before',
          headers: { auth_index: 'preserve-header' },
        },
        { 'api-key': 'synthetic-b', 'auth-index': 'sibling-index' },
      ],
    };
    const selected = normalizeProviderGroups([group])[0] as ProviderKeyConfig;
    const live = structuredClone(group);
    live.keys[0].auth_index = 'after';
    const writes = backend('codex', [live]);
    await providersApi.updateCodexConfig(selected.apiKey, selected.baseUrl, {
      ...selected,
      name: 'renamed',
    });
    expect(writes).toEqual([
      [
        {
          name: 'renamed',
          keys: [
            { 'api-key': 'synthetic-a', headers: { auth_index: 'preserve-header' } },
            { 'api-key': 'synthetic-b' },
          ],
        },
      ],
    ]);
  });

  test('real nested header changes still block concurrent saves', async () => {
    const group = {
      name: 'fixture',
      keys: [{ 'api-key': 'synthetic', auth_index: 'live', headers: { auth_index: 'before' } }],
    };
    const selected = normalizeProviderGroups([group])[0] as ProviderKeyConfig;
    const live = structuredClone(group);
    live.keys[0].headers.auth_index = 'changed';
    const writes = backend('codex', [live]);
    await expect(
      providersApi.updateCodexConfig(selected.apiKey, undefined, { ...selected, name: 'renamed' })
    ).rejects.toThrow();
    expect(writes).toEqual([]);
  });

  test('OpenAI group toggles strip group and key indexes even without editing a key', async () => {
    const group = {
      name: 'fixture',
      'base-url': 'https://example.invalid',
      auth_index: 'group',
      keys: [{ 'api-key': 'synthetic', auth_index: 'key' }],
    };
    const selected = normalizeProviderGroups([group], true)[0] as OpenAIProviderConfig;
    const writes = backend('openai-compatibility', [{ ...group, auth_index: 'refreshed' }]);
    await providersApi.updateOpenAIProviderDisabled(0, true, selected.source);
    expect(writes).toEqual([
      [
        {
          name: 'fixture',
          'base-url': group['base-url'],
          disabled: true,
          keys: [{ 'api-key': 'synthetic' }],
        },
      ],
    ]);
  });
});
