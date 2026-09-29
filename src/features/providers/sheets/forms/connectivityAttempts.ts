// Each key has its own attempt so batch tests do not invalidate one another.
export function createConnectivityAttempts() {
  const attempts = new Map<string, symbol>();
  return {
    begin(key: string): () => boolean {
      const token = Symbol();
      attempts.set(key, token);
      return () => attempts.get(key) === token;
    },
    invalidate(key: string): void {
      attempts.delete(key);
    },
    invalidateAll(): void {
      attempts.clear();
    },
  };
}
