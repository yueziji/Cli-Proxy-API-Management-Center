import { describe, expect, test } from 'bun:test';
import { createConnectivityAttempts } from '../src/features/providers/sheets/forms/connectivityAttempts';

describe('connectivity attempt lifecycle', () => {
  for (const outcome of ['success', 'failure'] as const) {
    test(`ignores a late ${outcome} after configuration changes or unmount`, async () => {
      const attempts = createConnectivityAttempts();
      let finish!: () => void;
      const response = new Promise<void>((resolve) => {
        finish = resolve;
      });
      const isCurrent = attempts.begin('codex');
      let status = 'idle';
      const pending = response.then(() => {
        if (isCurrent()) status = outcome;
      });
      attempts.invalidateAll();
      const next = attempts.begin('codex');
      finish();
      await pending;
      expect(status).toBe('idle');
      expect(next()).toBe(true);
    });
  }

  test('retesting the same entry invalidates its old response without affecting other keys', () => {
    const attempts = createConnectivityAttempts();
    const first = attempts.begin('openai:0');
    const other = attempts.begin('openai:1');
    const replacement = attempts.begin('openai:0');
    expect(first()).toBe(false);
    expect(other()).toBe(true);
    expect(replacement()).toBe(true);
  });

  test('removing or replacing an entry prevents a response from updating a reused index', () => {
    const attempts = createConnectivityAttempts();
    const removed = attempts.begin('openai:0');
    const other = attempts.begin('openai:1');
    attempts.invalidate('openai:0');
    const replacement = attempts.begin('openai:0');
    expect(removed()).toBe(false);
    expect(other()).toBe(true);
    expect(replacement()).toBe(true);
    attempts.invalidateAll();
    expect(other()).toBe(false);
    expect(replacement()).toBe(false);
  });
});
