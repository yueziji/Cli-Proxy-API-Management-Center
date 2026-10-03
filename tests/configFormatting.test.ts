import { describe, expect, test } from 'bun:test';
import { parseDocument } from 'yaml';
import { runVisualConfig } from './helpers/visualConfig';
import { buildConfigSaveDraft } from '../src/features/config/hooks/useConfigDocument';
import { buildConfigPatch, rebaseConfigDraft } from '../src/services/api/configPatch';
import { stringifyConfigYaml } from '../src/utils/configYaml';

const providerSection = `# provider layout
api-keys:
  codex: [
    {name: demo, keys: [
      {api-key: PLACEHOLDER, weight: 2}
    ]}
  ]
`;

describe('configuration formatting', () => {
  const siblingCases = [
    {
      name: 'server proxy list when changing the port',
      prefix: 'server:\n  port: 8317\n',
      section: '  trusted-proxies: [\n    127.0.0.1,\n    10.0.0.1\n  ]\n',
      patch: { port: '9000' },
    },
    {
      name: 'Payload rules when changing the request proxy',
      prefix: 'requests:\n  proxy-url: http://old.example\n',
      section:
        '  payload:\n    default: [\n      {models: [{name: demo}], params: {temperature: 0.5}}\n    ]\n',
      patch: { proxyUrl: 'http://new.example' },
    },
    {
      name: 'OAuth aliases when changing refresh workers',
      prefix: 'oauth:\n  auth-auto-refresh-workers: 2\n',
      section: '  model-alias:\n    claude: [\n      {name: original, alias: display}\n    ]\n',
      patch: { authAutoRefreshWorkers: '3' },
    },
    {
      name: 'Claude headers when changing cooling',
      prefix: 'upstream:\n  claude:\n    model-level-cooling: false\n',
      section: '    header-defaults: {\n      user-agent: demo,\n      timezone: Local\n    }\n',
      patch: { claudeModelLevelCooling: true },
    },
    {
      name: 'plugin settings when changing the global switch',
      prefix: 'plugins:\n  enabled: false\n',
      section: '  demo: {\n    custom: [one, two]\n  }\n',
      patch: { pluginsEnabled: true },
    },
  ];

  test.each(siblingCases)('preserves $name', ({ prefix, section, patch }) => {
    const source = prefix + section;
    const config = runVisualConfig(source, [patch]);
    const result = config.applyVisualChangesToYaml(source);
    expect(Object.keys(buildConfigPatch(source, result).patch).length).toBeGreaterThan(0);
    expect(result).toContain(section);
    const rebased = rebaseConfigDraft(source, result, source);
    expect(rebased).toContain(section);
    expect(parseDocument(rebased).toJS()).toEqual(parseDocument(result).toJS());
  });

  test('preserves other provider groups when one group is changed', () => {
    const otherProviders = `  claude: [
    {name: demo, keys: [{api-key: PLACEHOLDER}]}
  ]
  gemini: [
    {name: demo, keys: [{api-key: PLACEHOLDER}]}
  ]
`;
    const source = providerSection + otherProviders;
    const doc = parseDocument(source);
    doc.setIn(['api-keys', 'codex', 0, 'keys', 0, 'weight'], 9);
    const result = stringifyConfigYaml(doc, source);
    expect(result).toContain(otherProviders);
    expect(parseDocument(result).toJS()).toEqual(doc.toJS());
  });

  test('preserves a flow list inside an edited block sequence item', () => {
    const models = '    - models: [\n        {name: demo}\n      ]\n';
    const source = `requests:\n  rules:\n${models}      weight: 2\n`;
    const doc = parseDocument(source);
    doc.setIn(['requests', 'rules', 0, 'weight'], 9);
    const result = stringifyConfigYaml(doc, source);
    expect(result).toContain(models);
    expect(parseDocument(result).toJS()).toEqual(doc.toJS());
  });

  test('adjusts preserved child indentation when its edited parent is normalized', () => {
    const source = 'server:\n    port: 8317\n    future: {\n        nested: [one, two]\n    }\n';
    const doc = parseDocument(source);
    doc.setIn(['server', 'port'], 9000);
    const result = stringifyConfigYaml(doc, source);
    expect(result).toContain('  future: {\n      nested: [one, two]\n  }\n');
    expect(parseDocument(result).toJS()).toEqual(doc.toJS());
  });

  test.each(['|-', '|+', '>2-'])(
    'keeps scalar values and blank lines when a sequence gains indentation (%s)',
    (style) => {
      const source = `future:\n- name: demo\n  note: ${style}\n    line one\n      line two\n\n  weight: 2\n`;
      const doc = parseDocument(source);
      doc.setIn(['future', 0, 'weight'], 9);
      const result = stringifyConfigYaml(doc, source);
      expect(parseDocument(result).errors).toEqual([]);
      expect(parseDocument(result).toJS()).toEqual(doc.toJS());
      expect(result).toContain('      line one\n        line two\n');
    }
  );

  test('does not restore old list members during reorder and deletion', () => {
    const source =
      'future:\n  items:\n    - {name: one, values: [a, b]}\n    - {name: two, values: [c, d]}\n';
    const doc = parseDocument(source);
    doc.setIn(['future', 'items'], [{ name: 'two', values: ['c', 'd'] }]);
    const result = stringifyConfigYaml(doc, source);
    expect(parseDocument(result).toJS()).toEqual(doc.toJS());
    expect(result).not.toContain('name: one');
  });

  test('keeps literal tabs and Unicode whitespace when shifting block scalar indentation', () => {
    const source =
      'future:\n- name: demo\n  note: |-\n    \tkeep tab\n    \u00a0keep nonbreaking space\n  weight: 2\n';
    const doc = parseDocument(source);
    doc.setIn(['future', 0, 'weight'], 9);
    const result = stringifyConfigYaml(doc, source);
    expect(parseDocument(result).toJS()).toEqual(doc.toJS());
    expect(result).toContain('\tkeep tab');
    expect(result).toContain('\u00a0keep nonbreaking space');
  });

  test.each(['\n', '\r\n'])(
    'preserves untouched Codex layout in visual/source drafts (%j)',
    (eol) => {
      const provider = providerSection.replaceAll('\n', eol);
      const source = `${provider}${eol}server:${eol}  port: 8317${eol}`;
      const config = runVisualConfig(source, [{ port: '9000' }]);
      const preview = config.applyVisualChangesToYaml(source, 'draft');
      const saved = buildConfigSaveDraft(
        source,
        preview,
        false,
        'source',
        config.applyVisualChangesToYaml
      );

      expect(preview).toContain(provider);
      expect(saved).toContain(provider);
      expect(parseDocument(saved).getIn(['server', 'port'])).toBe(9000);
      expect(buildConfigPatch(source, saved)).toEqual({
        patch: { server: { port: 9000 } },
        deletions: [],
      });
      if (eol === '\r\n') expect(saved.replaceAll('\r\n', '')).not.toContain('\n');
    }
  );

  test('uses the latest provider values and layout when saving a stale visual draft', () => {
    const source = `${providerSection}server:\n  port: 8317\n`;
    const latestProvider = providerSection.replace('weight: 2', 'weight: 7');
    const latest = `${latestProvider}server:\n  port: 8317\n`;
    const config = runVisualConfig(source, [{ port: '9000' }]);
    const saved = config.applyVisualChangesToYaml(latest);

    expect(saved).toContain(latestProvider);
    expect(parseDocument(saved).getIn(['api-keys', 'codex', 0, 'keys', 0, 'weight'])).toBe(7);
    expect(parseDocument(saved).getIn(['server', 'port'])).toBe(9000);
  });

  test('recovery preserves untouched provider layout while replaying local edits', () => {
    const before = `${providerSection}server:\n  port: 8317\n`;
    const draft = before.replace('port: 8317', 'port: 9000');
    const latestProvider = providerSection.replace('weight: 2', 'weight: 7');
    const latest = `${latestProvider}server:\n  port: 8317\n`;
    const result = rebaseConfigDraft(before, draft, latest);

    expect(result).toContain(latestProvider);
    expect(parseDocument(result).getIn(['server', 'port'])).toBe(9000);
  });

  test('adds a new section after an unchanged final section without a trailing newline', () => {
    const source = providerSection.trimEnd();
    const config = runVisualConfig(source, [{ debug: true }]);
    const result = config.applyVisualChangesToYaml(source);
    const parsed = parseDocument(result);

    expect(result).toContain(`${source}\n`);
    expect(parsed.errors).toEqual([]);
    expect(parsed.getIn(['observability', 'logs', 'debug'])).toBe(true);
  });

  test('a source edit to provider values and formatting is saved verbatim', () => {
    const source = `${providerSection}server:\n  port: 8317\n`;
    const edited = source.replace('weight: 2', 'weight: 9');
    expect(buildConfigSaveDraft(source, edited, true, 'source', () => source)).toBe(edited);
  });

  test('unchanged drafts retain comments, blank lines, quoting and the final newline choice', () => {
    const source = `${providerSection}\n\n# quoted port\nserver: {port: '8317'}`;
    expect(stringifyConfigYaml(parseDocument(source), source)).toBe(source);
  });

  test('preserves anchors, aliases and multiline scalar content while updating another section', () => {
    const source = `defaults: &defaults
  note: |2-
    line one
      line two
${providerSection}future: *defaults
server: {port: 8317}
`;
    const doc = parseDocument(source);
    doc.setIn(['server', 'port'], 9000);
    const result = stringifyConfigYaml(doc, source);
    expect(result).toContain(providerSection);
    expect(result).toContain('defaults: &defaults\n  note: |2-\n    line one\n      line two\n');
    expect(parseDocument(result).toJS()).toEqual(doc.toJS());
  });

  test.each([
    '{server: {port: 8317}, future: {note: keep}}',
    '  server:\n    port: 8317\n  future:\n    note: |2-\n      preserve indentation\n',
    '? server\n: {port: 8317}\nfuture: keep\n',
  ])('keeps valid YAML when the root layout cannot be safely spliced (%j)', (source) => {
    const doc = parseDocument(source);
    doc.setIn(['server', 'port'], 9000);
    const result = parseDocument(stringifyConfigYaml(doc, source));
    expect(result.errors).toEqual([]);
    expect(result.toJS()).toEqual(doc.toJS());
  });

  test('never restores old provider values over an actual edit or deletion', () => {
    const source = `${providerSection}server: {port: 8317}\n`;
    const doc = parseDocument(source);
    doc.setIn(['api-keys', 'codex', 0, 'keys', 0, 'weight'], 9);
    expect(parseDocument(stringifyConfigYaml(doc, source)).toJS()).toEqual(doc.toJS());
    doc.delete('api-keys');
    expect(parseDocument(stringifyConfigYaml(doc, source)).has('api-keys')).toBe(false);
  });
});
