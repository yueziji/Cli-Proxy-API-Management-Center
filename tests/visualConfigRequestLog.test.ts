import { describe, expect, test } from 'bun:test';
import { createElement, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse as parseYaml } from 'yaml';
import { useVisualConfig } from '../src/hooks/useVisualConfig';
import { runVisualConfig } from './helpers/visualConfig';

describe('visual config request-log', () => {
  test('preserves legacy coercion and only writes an explicit edited value', () => {
    for (const [value, enabled] of [
      ['true', true],
      ['false', false],
      ['"false"', true],
      ['0', false],
      ['1', true],
      ['null', false],
    ] as const) {
      const yaml = `observability:\n  logs:\n    request-log: ${value}\nfuture: retained # keep\n`;
      const loaded = runVisualConfig(yaml);
      expect(loaded.visualValues.requestLog).toBe(enabled);
      expect(loaded.applyVisualChangesToYaml(yaml)).toBe(yaml);
      const changed = runVisualConfig(yaml, [{ requestLog: !enabled }]);
      expect([...changed.visualDirtyFields]).toEqual(['requestLog']);
      const output = changed.applyVisualChangesToYaml(yaml);
      expect(parseYaml(output).observability.logs['request-log']).toBe(!enabled);
      expect(output).toContain('future: retained # keep');
    }
    const yaml = 'future: retained\n';
    const reverted = runVisualConfig(yaml, [{ requestLog: true }, { requestLog: false }]);
    expect(reverted.visualDirty).toBe(false);
    expect(reverted.applyVisualChangesToYaml(yaml)).toBe(yaml);
  });

  test('loads and writes the request-log setting', () => {
    let loadedRequestLog: boolean | undefined;

    function Harness() {
      const visualConfig = useVisualConfig();
      const [phase, setPhase] = useState(0);

      if (phase === 0) {
        visualConfig.loadVisualValuesFromYaml('observability:\n  logs:\n    request-log: true\n');
        setPhase(1);
      } else if (phase === 1) {
        loadedRequestLog = visualConfig.visualValues.requestLog;
        visualConfig.setVisualValues({ requestLog: false });
        setPhase(2);
      } else {
        return createElement(
          'pre',
          null,
          visualConfig.applyVisualChangesToYaml(
            'observability:\n  logs:\n    debug: true\n    request-log: true\n'
          )
        );
      }

      return null;
    }

    const markup = renderToStaticMarkup(createElement(Harness));
    const result = markup.slice('<pre>'.length, -'</pre>'.length);

    expect(loadedRequestLog).toBe(true);
    expect(parseYaml(result)).toEqual({
      observability: { logs: { debug: true, 'request-log': false } },
    });
  });
});
