import { describe, expect, test } from 'bun:test';
import { createElement, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse as parseYaml } from 'yaml';
import { useVisualConfig } from '../src/hooks/useVisualConfig';

describe('visual config request-log', () => {
  test('loads and writes the request-log setting', () => {
    let loadedRequestLog: boolean | undefined;

    function Harness() {
      const visualConfig = useVisualConfig();
      const [phase, setPhase] = useState(0);

      if (phase === 0) {
        visualConfig.loadVisualValuesFromYaml('request-log: true\n');
        setPhase(1);
      } else if (phase === 1) {
        loadedRequestLog = visualConfig.visualValues.requestLog;
        visualConfig.setVisualValues({ requestLog: false });
        setPhase(2);
      } else {
        return createElement(
          'pre',
          null,
          visualConfig.applyVisualChangesToYaml('debug: true\nrequest-log: true\n')
        );
      }

      return null;
    }

    const markup = renderToStaticMarkup(createElement(Harness));
    const result = markup.slice('<pre>'.length, -'</pre>'.length);

    expect(loadedRequestLog).toBe(true);
    expect(parseYaml(result)).toEqual({ debug: true, 'request-log': false });
  });
});
