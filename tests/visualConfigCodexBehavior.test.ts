import { describe, expect, test } from 'bun:test';
import { createElement, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse as parseYaml } from 'yaml';
import { useVisualConfig } from '../src/hooks/useVisualConfig';
import type { VisualConfigValues } from '../src/types/visualConfig';

function editConfig(source: string, patches: Partial<VisualConfigValues>[], latest = source) {
  let loaded: VisualConfigValues | undefined;
  let result = '';
  let dirty: string[] = [];
  function Harness() {
    const config = useVisualConfig();
    const [phase, setPhase] = useState(0);
    if (phase === 0) {
      config.loadVisualValuesFromYaml(source);
      setPhase(1);
    } else if (phase <= patches.length) {
      loaded ??= config.visualValues;
      config.setVisualValues(patches[phase - 1]);
      setPhase(phase + 1);
    } else {
      loaded ??= config.visualValues;
      result = config.applyVisualChangesToYaml(latest);
      dirty = [...config.visualDirtyFields];
    }
    return null;
  }
  renderToStaticMarkup(createElement(Harness));
  return { loaded: loaded!, result, dirty };
}

const enabledYaml = `oauth:
  providers:
    codex:
      disable-codex-cloaking: true
      stream-bootstrap-buffering: true
      optimize-multi-agent-v2: true # preserve this option
      header-defaults: { user-agent: fixture-agent }
`;

describe('Codex OAuth behavior visual config', () => {
  test('defaults to off and does not inject OAuth settings on unrelated edits', () => {
    const { loaded, result } = editConfig('observability:\n  logs:\n    debug: false\n', [
      { debug: true },
    ]);
    expect(loaded.codexDisableCloaking).toBe(false);
    expect(loaded.codexStreamBootstrapBuffering).toBe(false);
    expect(parseYaml(result)).toEqual({ observability: { logs: { debug: true } } });
  });

  test('creates only the v8 OAuth mapping when enabling both switches', () => {
    const { result, dirty } = editConfig('observability:\n  logs:\n    debug: false\n', [
      { codexDisableCloaking: true, codexStreamBootstrapBuffering: true },
    ]);
    expect(parseYaml(result)).toEqual({
      observability: { logs: { debug: false } },
      oauth: {
        providers: {
          codex: {
            'disable-codex-cloaking': true,
            'stream-bootstrap-buffering': true,
          },
        },
      },
    });
    expect(dirty.sort()).toEqual(['codexDisableCloaking', 'codexStreamBootstrapBuffering']);
  });

  test('reads v8 values and writes explicit false while preserving sibling settings and comments', () => {
    const { loaded, result } = editConfig(enabledYaml, [
      { codexDisableCloaking: false, codexStreamBootstrapBuffering: false },
    ]);
    expect(loaded.codexDisableCloaking).toBe(true);
    expect(loaded.codexStreamBootstrapBuffering).toBe(true);
    const expected = parseYaml(enabledYaml);
    expected.oauth.providers.codex['disable-codex-cloaking'] = false;
    expected.oauth.providers.codex['stream-bootstrap-buffering'] = false;
    expect(parseYaml(result)).toEqual(expected);
    expect(result).toContain('# preserve this option');
  });

  test('only patches dirty fields in the latest YAML', () => {
    const latest =
      enabledYaml.replace('stream-bootstrap-buffering: true', 'stream-bootstrap-buffering: false') +
      '      future-option: keep\n';
    const { result } = editConfig(enabledYaml, [{ codexDisableCloaking: false }], latest);
    const expected = parseYaml(latest);
    expected.oauth.providers.codex['disable-codex-cloaking'] = false;
    expect(parseYaml(result)).toEqual(expected);
  });

  test('switching back to the baseline clears dirty state and keeps YAML untouched', () => {
    const { result, dirty } = editConfig(enabledYaml, [
      { codexDisableCloaking: false },
      { codexDisableCloaking: true },
    ]);
    expect(dirty).toEqual([]);
    expect(result).toBe(enabledYaml);
  });

  test('uses the v8 OAuth scope without reading or rewriting legacy or API-key settings', () => {
    const source = `codex: {disable-codex-cloaking: true, stream-bootstrap-buffering: true}
oauth:
  providers:
    codex: {disable-codex-cloaking: false, stream-bootstrap-buffering: false}
api-keys:
  codex:
    - name: fixture
      keys: [{api-key: fixture-key, disable-codex-cloaking: false}]
`;
    const { loaded, result } = editConfig(source, [{ codexDisableCloaking: true }]);
    expect(loaded.codexDisableCloaking).toBe(false);
    expect(loaded.codexStreamBootstrapBuffering).toBe(false);
    const expected = parseYaml(source);
    expected.oauth.providers.codex['disable-codex-cloaking'] = true;
    expect(parseYaml(result)).toEqual(expected);
  });

  test('keeps the archived identity setting as a comment and never recreates the legacy block', () => {
    const archived = '# codex:\n#   identity-confuse: true\n';
    const source = enabledYaml + archived;
    const { loaded, result } = editConfig(source, [{ codexDisableCloaking: false }]);
    expect(loaded.codexDisableCloaking).toBe(true);
    expect(loaded.codexStreamBootstrapBuffering).toBe(true);
    expect(result).toContain('#   identity-confuse: true');
    const parsed = parseYaml(result);
    expect(parsed.codex).toBeUndefined();
    expect(parsed.oauth.providers.codex['identity-confuse']).toBeUndefined();
    expect(parsed.oauth.providers.codex['disable-codex-cloaking']).toBe(false);
  });
});
