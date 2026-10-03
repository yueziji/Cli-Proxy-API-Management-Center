import { describe, expect, test } from 'bun:test';
import { parseDocument } from 'yaml';
import { runVisualConfig } from './helpers/visualConfig';
import { buildConfigPatch, rebaseConfigDraft } from '@/services/api/configPatch';
import { findConfigFieldById } from '@/features/config/searchIndex';

// Independent contract fixture from CLIProxyAPI v8.0.12 config_v8.go.
const fields = [
  ['codexDisableCloaking', 'upstream.codex.disable-codex-cloaking', true],
  ['codexModelLevelCooling', 'upstream.codex.model-level-cooling', true],
  ['codexStreamBootstrapBuffering', 'upstream.codex.stream-bootstrap-buffering', true],
  ['codexStreamBootstrapTimeout', 'upstream.codex.stream-bootstrap-timeout', '17s'],
  ['codexOrphanDelegationCompatibility', 'upstream.codex.orphan-delegation-compatibility', true],
  ['codexResponseSteering', 'upstream.codex.response-steering', true],
  ['claudeModelLevelCooling', 'upstream.claude.model-level-cooling', true],
  ['claudeDisableCloakMode', 'upstream.claude.disable-claude-cloak-mode', true],
  ['claudeCodeDisableCloakingModelList', 'upstream.claude.disable-cloaking-model-list', true],
  ['claudeHeaderUserAgent', 'upstream.claude.header-defaults.user-agent', 'test-agent'],
  ['claudeHeaderPackageVersion', 'upstream.claude.header-defaults.package-version', '1.2.3'],
  ['claudeHeaderRuntimeVersion', 'upstream.claude.header-defaults.runtime-version', 'v22.1.0'],
  ['claudeHeaderOs', 'upstream.claude.header-defaults.os', 'Linux'],
  ['claudeHeaderArch', 'upstream.claude.header-defaults.arch', 'arm64'],
  ['claudeHeaderTimeout', 'upstream.claude.header-defaults.timeout', '123'],
  ['claudeHeaderTimezone', 'upstream.claude.header-defaults.timezone', 'Asia/Shanghai'],
  [
    'claudeHeaderStabilizeDeviceProfile',
    'upstream.claude.header-defaults.stabilize-device-profile',
    true,
  ],
  ['xaiInjectXSearch', 'upstream.xai.inject-x-search', true],
  ['codexOptimizeMultiAgentV2', 'client.codex.optimize-multi-agent-v2', true],
  ['codexEnableApplyPatch', 'client.codex.enable-apply-patch', true],
] as const;

const oauthOnly = `oauth:
  providers:
    codex:
      header-defaults: {user-agent: oauth-agent, beta-features: multi_agent}
      live-media-relay: {enabled: true}
    antigravity: {connection-pool: {enabled: true}}
    devin: {sensitive-words: [fixture]}
api-keys:
  codex: [{name: example, keys: [{api-key: synthetic-key, disable-codex-cloaking: false}]}]
`;

describe('v8.0.12 shared upstream and client configuration', () => {
  for (const [key, path, value] of fields) {
    test(`${key}: canonical readback, search and save agree without changing OAuth-only fields`, () => {
      const doc = parseDocument(oauthOnly);
      doc.setIn(path.split('.'), value);
      const yaml = doc.toString();
      const loaded = runVisualConfig(yaml);
      expect(loaded.visualValues[key]).toBe(value);
      expect(loaded.visualDirty).toBe(false);
      expect(parseDocument(loaded.applyVisualChangesToYaml(yaml)).toJS()).toEqual(doc.toJS());
      expect(findConfigFieldById(key)?.yamlKeys?.join('.')).toBe(path);
      const desired = typeof value === 'boolean' ? false : '';
      const changed = runVisualConfig(yaml, [{ [key]: desired }]);
      const output = changed.applyVisualChangesToYaml(yaml);
      const saved = parseDocument(output);
      expect(saved.getIn(['oauth'])?.toJSON()).toEqual(doc.getIn(['oauth'])?.toJSON());
      expect(saved.getIn(['api-keys'])?.toJSON()).toEqual(doc.getIn(['api-keys'])?.toJSON());
      expect(runVisualConfig(output).visualValues[key]).toBe(desired);
      expect(changed.visualDirty).toBe(true);
    });
  }

  test('historical aliases use presence precedence, including false, null and empty strings', () => {
    const historical = `oauth: {providers: {codex: {response-steering: true, optimize-multi-agent-v2: true}, claude: {header-defaults: {user-agent: historical}}}}
providers: {codex: {optimize-multi-agent-v2: true}}
codex: {optimize-multi-agent-v2: true}
`;
    expect(runVisualConfig(historical).visualValues.codexOptimizeMultiAgentV2).toBe(true);
    for (const value of ['false', 'null']) {
      const current =
        historical +
        `upstream: {codex: {response-steering: ${value}}, claude: {header-defaults: {user-agent: ''}}}
client: {codex: {optimize-multi-agent-v2: ${value}}}
`;
      const values = runVisualConfig(current).visualValues;
      expect(values.codexResponseSteering).toBe(false);
      expect(values.codexOptimizeMultiAgentV2).toBe(false);
      expect(values.claudeHeaderUserAgent).toBe('');
    }
    expect(
      runVisualConfig(
        historical.replace('optimize-multi-agent-v2: true', 'optimize-multi-agent-v2: false')
      ).visualValues.codexOptimizeMultiAgentV2
    ).toBe(false);
    expect(
      runVisualConfig(
        'providers: {codex: {optimize-multi-agent-v2: false}}\ncodex: {optimize-multi-agent-v2: true}'
      ).visualValues.codexOptimizeMultiAgentV2
    ).toBe(false);
    expect(
      runVisualConfig('codex: {optimize-multi-agent-v2: true}').visualValues
        .codexOptimizeMultiAgentV2
    ).toBe(true);
  });

  test('migrates an edited alias with comments without DELETE targeting the just-written value', () => {
    const yaml = `oauth:
  providers:
    codex:
      # keep field explanation
      response-steering: true # keep inline comment
      header-defaults: {user-agent: untouched}
`;
    const changed = runVisualConfig(yaml, [{ codexResponseSteering: false }]);
    const output = changed.applyVisualChangesToYaml(yaml);
    expect(output).toContain('# keep field explanation');
    expect(output).toContain('# keep inline comment');
    expect(parseDocument(output).hasIn(['oauth', 'providers', 'codex', 'response-steering'])).toBe(
      false
    );
    expect(buildConfigPatch(yaml, output)).toEqual({
      patch: { upstream: { codex: { 'response-steering': false } } },
      deletions: [],
    });
    expect(
      runVisualConfig(rebaseConfigDraft(yaml, output, yaml)).visualValues.codexResponseSteering
    ).toBe(false);
  });

  test('clearing historical timeout emits one canonical deletion and survives partial-save recovery', () => {
    const yaml =
      'oauth: {providers: {codex: {stream-bootstrap-timeout: 20s, header-defaults: {user-agent: keep}}}}';
    const changed = runVisualConfig(yaml, [{ codexStreamBootstrapTimeout: '' }]);
    const output = changed.applyVisualChangesToYaml(yaml);
    expect(buildConfigPatch(yaml, output)).toEqual({
      patch: {},
      deletions: [['upstream', 'codex', 'stream-bootstrap-timeout']],
    });
    const recovered = rebaseConfigDraft(yaml, output, yaml);
    expect(runVisualConfig(recovered).visualValues.codexStreamBootstrapTimeout).toBe('');
    expect(runVisualConfig(recovered).visualValues.codexHeaderUserAgent).toBe('keep');
  });

  test('new apply_patch default stays absent until edited and saves explicit false', () => {
    expect(runVisualConfig('{}').visualValues.codexEnableApplyPatch).toBe(false);
    const changed = runVisualConfig('client: {codex: {enable-apply-patch: true}}', [
      { codexEnableApplyPatch: false },
    ]);
    expect(
      parseDocument(
        changed.applyVisualChangesToYaml('client: {codex: {enable-apply-patch: true}}')
      ).getIn(['client', 'codex', 'enable-apply-patch'])
    ).toBe(false);
  });

  test('moving anchored historical fields keeps dependent values and unrelated anchors intact', () => {
    for (const old of [
      'codex:\n      response-steering: &enabled true',
      'codex: &codex-settings\n      response-steering: true',
    ]) {
      const consumer = old.includes('&enabled')
        ? 'routing: {session-affinity: *enabled}'
        : 'future: *codex-settings';
      const yaml = `oauth:\n  providers:\n    ${old}\n${consumer}\nother: &keep value\nother-copy: *keep\n`;
      const changed = runVisualConfig(yaml, [{ codexResponseSteering: false }]);
      expect(changed.visualValues.codexResponseSteering).toBe(false);
      const output = changed.applyVisualChangesToYaml(yaml);
      const saved = parseDocument(output).toJS();
      expect(saved.upstream.codex['response-steering']).toBe(false);
      if (saved.routing) expect(saved.routing['session-affinity']).toBe(true);
      if (saved.future) expect(saved.future['response-steering']).toBe(true);
      expect(output).toContain('&keep');
      expect(output).toContain('*keep');
      expect(buildConfigPatch(yaml, output)).toEqual({
        patch: { upstream: { codex: { 'response-steering': false } } },
        deletions: [],
      });
    }
  });
});
