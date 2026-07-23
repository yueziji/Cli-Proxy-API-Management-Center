import { describe, expect, test } from 'bun:test';
import { openaiToResource } from '../src/features/providers/adapters';
import { normalizeConfigResponse } from '../src/services/api/transformers';

describe('OpenAI provider source indexes', () => {
  test('preserves backend indexes when invalid entries are filtered', () => {
    const config = normalizeConfigResponse({
      'openai-compatibility': [
        { 'base-url': 'https://invalid.example.com/v1' },
        {
          name: 'first-valid',
          'base-url': 'https://first.example.com/v1',
          'api-key-entries': [{ 'api-key': 'first-key' }],
        },
        {
          name: 'second-valid',
          'base-url': 'https://second.example.com/v1',
          'api-key-entries': [{ 'api-key': 'second-key' }],
        },
      ],
    });

    expect(config.openaiCompatibility?.map((item) => item.sourceIndex)).toEqual([1, 2]);
    const resource = openaiToResource(config.openaiCompatibility![1], 1);
    expect(resource.originalIndex).toBe(2);
    expect(resource.selector).toEqual({
      brand: 'openaiCompatibility',
      name: 'second-valid',
      index: 2,
    });
  });
});
