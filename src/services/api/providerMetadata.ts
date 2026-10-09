import { isRecord } from '@/utils/helpers';

/** Backend spellings and precedence stay separate from upstream response transformers. */
export function readProviderAuthIndex(record: Record<string, unknown> | null): string | undefined {
  const value = record?.auth_index ?? record?.['auth-index'];
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed || undefined;
}

export function readProviderDisableCooling(
  record: Record<string, unknown> | null
): boolean | undefined {
  if (!record) return undefined;
  let hasFalse = false;
  for (const key of ['disable-cooling', 'disableCooling', 'disable_cooling']) {
    if (record[key] === true) return true;
    if (record[key] === false) hasFalse = true;
  }
  return hasFalse ? false : undefined;
}

/** Only credential/group metadata is transient; nested headers and models are user data. */
export function withoutAuthIndex<T>(value: T): T {
  if (!isRecord(value)) return value;
  const copy = { ...value };
  delete copy.auth_index;
  delete copy['auth-index'];
  return copy as T;
}

export function withoutProviderAuthIndexes<T>(group: T): T {
  if (!isRecord(group)) return group;
  const copy = withoutAuthIndex<Record<string, unknown>>(group);
  if (Array.isArray(copy.keys)) copy.keys = copy.keys.map(withoutAuthIndex);
  return copy as T;
}
