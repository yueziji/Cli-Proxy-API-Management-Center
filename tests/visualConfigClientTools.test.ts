import { describe, expect, test } from 'bun:test';
import { parseDocument } from 'yaml';
import { buildConfigPatch, rebaseConfigDraft } from '@/services/api/configPatch';
import { runVisualConfig } from './helpers/visualConfig';

// Independent backend contract: config_types.go and sdk_config.go.
const source = `client:
  codex:
    optimize-multi-agent-v2: true # retain existing setting
    web-search-result-cache:
      enabled: true
      ttl: 1800
      limit: 2048
upstream:
  claude:
    tool-search: true
    model-level-cooling: true
routing:
  session-affinity: true
  session-affinity-rebind-on: quota
requests:
  streaming:
    keepalive-seconds: 10
    bootstrap-retries: 2
    send-keepalive-before-ft: true
future: retained # preserve unknown fields
`;
const fields = [
  ['codexWebSearchResultCacheEnabled', 'client.codex.web-search-result-cache.enabled', true, false],
  ['codexWebSearchResultCacheTTL', 'client.codex.web-search-result-cache.ttl', '1800', '30m'],
  ['codexWebSearchResultCacheLimit', 'client.codex.web-search-result-cache.limit', '2048', '512'],
  ['routingSessionAffinityRebindOn', 'routing.session-affinity-rebind-on', 'quota', 'never'],
  ['claudeToolSearch', 'upstream.claude.tool-search', true, false],
  ['streamingSendKeepAliveBeforeFT', 'requests.streaming.send-keepalive-before-ft', true, false],
] as const;

describe('client tools and session configuration', () => {
  for (const [key, path, initial, desired] of fields) {
    test(`${key}: changes only the canonical leaf and preserves other values and comments`, () => {
      const loaded = runVisualConfig(source);
      expect(loaded.visualValues[key]).toBe(initial);
      expect(loaded.applyVisualChangesToYaml(source)).toBe(source);

      const changed = runVisualConfig(source, [{ [key]: desired }]);
      expect([...changed.visualDirtyFields]).toEqual([key]);
      const output = changed.applyVisualChangesToYaml(source);
      const expected = parseDocument(source);
      expected.setIn(path.split('.'), key.endsWith('Limit') ? Number(desired) : desired);
      expect(parseDocument(output).toJS()).toEqual(expected.toJS());
      expect(runVisualConfig(output).visualValues[key]).toBe(desired);
      expect(output).toContain('# retain existing setting');
      expect(output).toContain('future: retained # preserve unknown fields');
    });
  }

  test('unrelated edits do not inject optional settings', () => {
    const changed = runVisualConfig('observability: {logs: {debug: false}}\n', [{ debug: true }]);
    expect(
      parseDocument(
        changed.applyVisualChangesToYaml('observability: {logs: {debug: false}}\n')
      ).toJS()
    ).toEqual({
      observability: { logs: { debug: true } },
    });
    const defaults = runVisualConfig('{}').visualValues;
    for (const [key, , initial] of fields) {
      expect(defaults[key]).toBe(typeof initial === 'boolean' ? false : '');
    }
  });

  test('clearing cache parameters and failover uses backend defaults without deleting siblings', () => {
    const changed = runVisualConfig(source, [
      {
        codexWebSearchResultCacheTTL: '',
        codexWebSearchResultCacheLimit: '',
        routingSessionAffinityRebindOn: '',
      },
    ]);
    const output = changed.applyVisualChangesToYaml(source);
    const doc = parseDocument(output);
    expect(doc.getIn(['client', 'codex', 'web-search-result-cache']).toJSON()).toEqual({
      enabled: true,
    });
    expect(doc.getIn(['routing']).toJSON()).toEqual({ 'session-affinity': true });
    const plan = buildConfigPatch(source, output);
    expect(plan.deletions).toContainEqual(['client', 'codex', 'web-search-result-cache', 'ttl']);
    expect(plan.deletions).toContainEqual(['client', 'codex', 'web-search-result-cache', 'limit']);
    expect(plan.deletions).toContainEqual(['routing', 'session-affinity-rebind-on']);
  });

  test('recovery replays a changed cache leaf onto the latest sibling values', () => {
    const draft = runVisualConfig(source, [
      { codexWebSearchResultCacheLimit: '512' },
    ]).applyVisualChangesToYaml(source);
    const latest = source
      .replace('ttl: 1800', 'ttl: 3600')
      .replace('keepalive-seconds: 10', 'keepalive-seconds: 15');
    const recovered = rebaseConfigDraft(source, draft, latest);
    const values = runVisualConfig(recovered).visualValues;
    expect(values.codexWebSearchResultCacheLimit).toBe('512');
    expect(values.codexWebSearchResultCacheTTL).toBe('3600');
    expect(values.streaming.keepaliveSeconds).toBe('15');
  });

  test('the cache flag follows its strict decoder rather than YAML 1.1 spellings', () => {
    const values = runVisualConfig(
      'client: {codex: {web-search-result-cache: {enabled: yes}}}'
    ).visualValues;
    expect(values.codexWebSearchResultCacheEnabled).toBe(false);
  });

  for (const ttl of [
    '0',
    '+0',
    '-0',
    '1800',
    '30m',
    '24h',
    '0s',
    '9223372036',
    '9223372036854775807ns',
  ]) {
    test(`accepts backend cache TTL ${ttl}`, () => {
      const changed = runVisualConfig('{}', [{ codexWebSearchResultCacheTTL: ttl }]);
      expect(changed.visualValidationErrors.codexWebSearchResultCacheTTL).toBeUndefined();
      expect(
        runVisualConfig(changed.applyVisualChangesToYaml('{}')).visualValues
          .codexWebSearchResultCacheTTL
      ).toBe(ttl);
    });
  }
  for (const ttl of ['-1', '-1s', '1.5', 'never', '9223372037', '9223372036854775808ns']) {
    test(`rejects invalid or overflowing cache TTL ${ttl}`, () => {
      const changed = runVisualConfig('{}', [{ codexWebSearchResultCacheTTL: ttl }]);
      expect(changed.visualValidationErrors.codexWebSearchResultCacheTTL).toBe('invalid_duration');
    });
  }
  for (const limit of ['-1', '1.5', '9007199254740992']) {
    test(`rejects invalid cache capacity ${limit}`, () => {
      const changed = runVisualConfig('{}', [{ codexWebSearchResultCacheLimit: limit }]);
      expect(changed.visualValidationErrors.codexWebSearchResultCacheLimit).toBe(
        'non_negative_integer'
      );
    });
  }
  test('zero cache capacity and supported failover choices remain valid', () => {
    for (const rebind of ['', 'any', 'quota', 'never']) {
      const changed = runVisualConfig('{}', [
        {
          routingSessionAffinityRebindOn: rebind,
          codexWebSearchResultCacheLimit: '0',
        },
      ]);
      expect(changed.visualValidationErrors.routingSessionAffinityRebindOn).toBeUndefined();
      expect(changed.visualValidationErrors.codexWebSearchResultCacheLimit).toBeUndefined();
    }
    const invalid = runVisualConfig('{}', [{ routingSessionAffinityRebindOn: 'sometimes' }]);
    expect(invalid.visualValidationErrors.routingSessionAffinityRebindOn).toBe(
      'invalid_session_affinity_rebind'
    );
  });

  test('untouched historical TTL and failover values do not block unrelated edits', () => {
    const historical = source
      .replace('ttl: 1800', 'ttl: legacy')
      .replace('rebind-on: quota', 'rebind-on: custom');
    const changed = runVisualConfig(historical, [{ requestLog: true }]);
    expect(changed.visualValidationErrors.codexWebSearchResultCacheTTL).toBeUndefined();
    expect(changed.visualValidationErrors.routingSessionAffinityRebindOn).toBeUndefined();
    const output = changed.applyVisualChangesToYaml(historical);
    expect(output).toContain('ttl: legacy');
    expect(output).toContain('rebind-on: custom');
  });
});
