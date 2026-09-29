import { describe, expect, test } from 'bun:test';
import {
  interactionsToResource,
  geminiToResource,
  openaiToResource,
} from '../src/features/providers/adapters';
import {
  resolveTotalStats,
  resolveRecentWindowStats,
  resolveStatusBarData,
} from '../src/features/providers/resourceStats';
import { buildRecentRequestCompositeKey } from '../src/utils/recentRequests';
import type { ProviderRecentUsageMap } from '../src/components/providers/utils';

describe('provider resource usage mapping', () => {
  const config = { apiKey: 'fixture', baseUrl: 'https://example.com' };
  const compositeKey = buildRecentRequestCompositeKey(config.baseUrl, config.apiKey);
  const usage: ProviderRecentUsageMap = new Map([
    [
      'gemini-interactions',
      new Map([
        [
          compositeKey,
          {
            success: 7,
            failed: 2,
            recentRequests: [{ time: new Date().toISOString(), success: 3, failed: 1 }],
          },
        ],
      ]),
    ],
    ['gemini', new Map([[compositeKey, { success: 11, failed: 0, recentRequests: [] }]])],
  ]);

  test('resolves Interactions totals, recent sort values and status bars from its backend key', () => {
    const resource = interactionsToResource(config, 0);
    expect(resolveTotalStats(resource, usage)).toEqual({ success: 7, failure: 2 });
    expect(resolveRecentWindowStats(resource, usage)).toEqual({ success: 3, failure: 1 });
    const status = resolveStatusBarData(resource, usage);
    expect(status.totalSuccess).toBe(3);
    expect(status.totalFailure).toBe(1);
  });

  test('keeps Gemini and custom OpenAI provider names separate', () => {
    expect(resolveTotalStats(geminiToResource(config, 0), usage)).toEqual({
      success: 11,
      failure: 0,
    });
    const resource = openaiToResource(
      {
        name: 'gemini-interactions',
        baseUrl: config.baseUrl,
        apiKeyEntries: [{ apiKey: config.apiKey }],
      },
      0
    );
    expect(resolveTotalStats(resource, usage)).toEqual({ success: 7, failure: 2 });
  });
});
