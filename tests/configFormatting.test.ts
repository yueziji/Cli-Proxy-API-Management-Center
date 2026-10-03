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
