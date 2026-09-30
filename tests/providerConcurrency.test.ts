import { afterEach, describe, expect, test } from 'bun:test';
import { apiClient } from '../src/services/api/client';
import { providersApi } from '../src/services/api/providers';
import { normalizeProviderGroups } from '../src/services/api/transformers';
import type { ProviderKeyConfig } from '../src/types';

const originalGet = apiClient.get;
const originalPut = apiClient.put;
afterEach(() => {
  apiClient.get = originalGet;
  apiClient.put = originalPut;
});

function backend(groups: Record<string, unknown>[]) {
  let saved: unknown;
  apiClient.get = (async () => ({
    'api-keys': { codex: structuredClone(groups) },
  })) as typeof apiClient.get;
  apiClient.put = (async (url: string, data: unknown) => {
    expect(url).toBe('/config/api-keys/codex');
    saved = data;
  }) as typeof apiClient.put;
  return () => saved;
}

describe('provider list concurrency', () => {
  test('preserves concurrent additions while appending a provider', async () => {
    const latest = [
      { name: 'existing', keys: [{ 'api-key': 'existing', custom: 'keep' }] },
      { name: 'concurrent', keys: [{ 'api-key': 'concurrent', custom: 'also-keep' }] },
    ];
    const saved = backend(latest);
    await providersApi.createCodexConfig({ apiKey: 'created' });
    expect(saved()).toEqual([...latest, { name: 'codex-3', keys: [{ 'api-key': 'created' }] }]);
  });

  test('replaces only the selected provider after a concurrent group insertion', async () => {
    const selected = {
      name: 'existing',
      keys: [{ 'api-key': 'existing', custom: 'keep' }],
    };
    const [snapshot] = normalizeProviderGroups([selected]) as ProviderKeyConfig[];
    const concurrent = {
      name: 'concurrent',
      keys: [{ 'api-key': 'concurrent', custom: 'also-keep' }],
    };
    const saved = backend([concurrent, selected]);
    await providersApi.updateCodexConfig(snapshot.apiKey, undefined, {
      ...snapshot,
      apiKey: 'updated',
    });
    expect(saved()).toEqual([
      concurrent,
      { ...selected, keys: [{ 'api-key': 'updated', custom: 'keep' }] },
    ]);
  });
});
