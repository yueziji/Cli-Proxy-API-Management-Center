import { afterAll, afterEach, describe, expect, spyOn, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { apiCallApi } from '../src/services/api';
import type { ApiCallResult } from '../src/services/api/apiCall';
import {
  useConnectivityTest,
  type UseConnectivityTestArgs,
  type UseConnectivityTestResult,
} from '../src/features/providers/sheets/forms/useConnectivityTest';
import { validateBaseUrl } from '../src/utils/validation';

const messages = {
  baseUrlRequired: 'base required',
  endpointInvalid: 'invalid endpoint',
  apiKeyRequired: 'key required',
  modelRequired: 'model required',
  timeout: () => 'timeout',
  requestFailed: 'failed',
};

function setup(brand: UseConnectivityTestArgs['brand'], baseUrl: string) {
  let result!: UseConnectivityTestResult;
  function Harness() {
    result = useConnectivityTest(
      {
        brand,
        baseUrl,
        testModel: 'fixture-model',
        models: [],
        formHeaders: [],
        authIndex: 'fixture-index',
        apiKeyEntries: [{ apiKey: '', proxyUrl: '', authIndex: 'fixture-index' }],
      },
      messages
    );
    return null;
  }
  renderToStaticMarkup(createElement(Harness));
  const run = () =>
    brand === 'openaiCompatibility'
      ? result.runOpenAIKey(0)
      : brand === 'claude'
        ? result.runClaude()
        : brand === 'gemini' || brand === 'interactions'
          ? result.runGemini()
          : result.runCodex();
  return { run };
}

const request = spyOn(apiCallApi, 'request');
afterEach(() => request.mockReset());
afterAll(() => request.mockRestore());
const success: ApiCallResult = { statusCode: 200, header: {}, bodyText: '', body: null };

describe('connectivity request URLs', () => {
  for (const brand of ['xai', 'meta'] as const) {
    test(`${brand}: a versioned base URL is valid and produces one responses endpoint`, async () => {
      request.mockResolvedValue(success);
      const baseUrl = 'https://example.invalid/v1';
      expect(validateBaseUrl(baseUrl, brand).warningKeys).not.toContain('baseUrlEndpointSuffix');
      await setup(brand, baseUrl).run();
      expect(request.mock.calls.at(-1)![0].url).toBe(`${baseUrl}/responses`);
      expect(validateBaseUrl(`${baseUrl}/responses`, brand).warningKeys).toContain(
        'baseUrlEndpointSuffix'
      );
    });
  }

  const brands = [
    'openaiCompatibility',
    'codex',
    'meta',
    'xai',
    'gemini',
    'interactions',
    'claude',
  ] as const;
  for (const brand of brands) {
    test(`${brand}: testing uses the saved scheme and normalized base URL`, async () => {
      request.mockResolvedValue(success);
      for (const raw of ['example.com/', 'http://example.com/', 'https://example.com/']) {
        await setup(brand, raw).run();
        const url = request.mock.calls.at(-1)![0].url;
        expect(url.startsWith(`${validateBaseUrl(raw, brand).normalized}/`)).toBe(true);
      }
    });

    test(`${brand}: invalid URLs never issue a request`, async () => {
      for (const raw of ['ftp://example.com', 'https://exa mple.com', 'https://[invalid']) {
        await setup(brand, raw).run();
      }
      expect(request).not.toHaveBeenCalled();
    });
  }

  for (const outcome of ['success', 'failure'] as const) {
    test(`OpenAI ignores an older ${outcome} after starting another test`, async () => {
      let finish!: (value: ApiCallResult) => void;
      let fail!: (error: Error) => void;
      request.mockImplementationOnce(
        () =>
          new Promise((resolve, reject) => {
            finish = resolve;
            fail = reject;
          })
      );
      request.mockResolvedValueOnce(success);
      const { run } = setup('openaiCompatibility', 'example.com/v1');
      const old = run();
      expect(await run()).toBe(true);
      if (outcome === 'success') finish(success);
      else fail(new Error('late timeout'));
      expect(await old).toBe(false);
    });
  }
});
