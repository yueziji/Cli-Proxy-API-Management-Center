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

const enabledYaml = `codex:
  identity-confuse: true
  disable-codex-cloaking: true
  stream-bootstrap-buffering: true
  optimize-multi-agent-v2: true # preserve this option
`;

describe('Codex behavior visual config', () => {
  test('defaults to off and does not inject a Codex block on unrelated edits', () => {
    const { loaded, result } = editConfig('debug: false\n', [{ debug: true }]);
    expect(loaded.codexIdentityConfuse).toBe(false);
    expect(loaded.codexDisableCloaking).toBe(false);
    expect(loaded.codexStreamBootstrapBuffering).toBe(false);
    expect(parseYaml(result)).toEqual({ debug: true });
  });

  test('creates the Codex mapping when enabling all three switches', () => {
    const { result, dirty } = editConfig('debug: false\n', [
      {
        codexIdentityConfuse: true,
        codexDisableCloaking: true,
        codexStreamBootstrapBuffering: true,
      },
    ]);
    expect(parseYaml(result)).toEqual({
      debug: false,
      codex: {
        'identity-confuse': true,
        'disable-codex-cloaking': true,
        'stream-bootstrap-buffering': true,
      },
    });
    expect(dirty.sort()).toEqual([
      'codexDisableCloaking',
      'codexIdentityConfuse',
      'codexStreamBootstrapBuffering',
    ]);
  });

  test('loads enabled switches and writes explicit false while preserving sibling settings and comments', () => {
    const { loaded, result } = editConfig(enabledYaml, [
      {
        codexIdentityConfuse: false,
        codexDisableCloaking: false,
        codexStreamBootstrapBuffering: false,
      },
    ]);
    expect(loaded.codexIdentityConfuse).toBe(true);
    expect(loaded.codexDisableCloaking).toBe(true);
    expect(loaded.codexStreamBootstrapBuffering).toBe(true);
    expect(parseYaml(result)).toEqual({
      codex: {
        'identity-confuse': false,
        'disable-codex-cloaking': false,
        'stream-bootstrap-buffering': false,
        'optimize-multi-agent-v2': true,
      },
    });
    expect(result).toContain('# preserve this option');
  });

  test('only patches dirty fields in the latest YAML', () => {
    const latest =
      enabledYaml.replace('identity-confuse: true', 'identity-confuse: false') +
      '  future-option: keep\n';
    const { result } = editConfig(enabledYaml, [{ codexDisableCloaking: false }], latest);
    expect(parseYaml(result).codex).toEqual({
      'identity-confuse': false,
      'disable-codex-cloaking': false,
      'stream-bootstrap-buffering': true,
      'optimize-multi-agent-v2': true,
      'future-option': 'keep',
    });
  });

  test('switching back to the baseline clears dirty state and keeps YAML untouched', () => {
    const { result, dirty } = editConfig(enabledYaml, [
      { codexIdentityConfuse: false },
      { codexIdentityConfuse: true },
    ]);
    expect(dirty).toEqual([]);
    expect(result).toBe(enabledYaml);
  });
});
