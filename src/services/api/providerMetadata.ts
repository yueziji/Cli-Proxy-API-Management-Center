import { isRecord } from '@/utils/helpers';

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
