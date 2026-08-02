import type { AuthFileFieldsPatch } from '@/services/api';

export type ForkAuthFileEditorErrorKey = 'auth_files.refresh_interval_invalid';
type ResolveRefreshIntervalError = (key: ForkAuthFileEditorErrorKey) => string;

export type ForkAuthFileEditorField = 'refreshInterval';

export type ForkAuthFileEditorState = {
  refreshInterval: string;
  refreshIntervalTouched: boolean;
  refreshIntervalError: string | null;
};

type ForkAuthFileEditorContext = ForkAuthFileEditorState & {
  json: Record<string, unknown> | null;
};

const REFRESH_INTERVAL_KEYS = [
  'refresh_interval',
  'refreshInterval',
  'refresh_interval_seconds',
  'refreshIntervalSeconds',
] as const;

const REFRESH_INTERVAL_SECONDS_KEYS = new Set<string>([
  'refresh_interval_seconds',
  'refreshIntervalSeconds',
]);

const REFRESH_INTERVAL_SEGMENT_PATTERN = /(\d+(?:\.\d+)?)(ns|us|ms|s|m|h)/g;

const normalizeRefreshIntervalField = (value: unknown, key: string): string => {
  if (typeof value === 'string') return value.trim();
  if (
    REFRESH_INTERVAL_SECONDS_KEYS.has(key) &&
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0
  ) {
    return `${value}s`;
  }
  return '';
};

const readRefreshInterval = (value: Record<string, unknown>): string => {
  for (const key of REFRESH_INTERVAL_KEYS) {
    const normalized = normalizeRefreshIntervalField(value[key], key);
    if (normalized) return normalized;
  }
  return '';
};

const validateRefreshIntervalText = (value: string): ForkAuthFileEditorErrorKey | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let matchedText = '';
  let hasPositiveSegment = false;
  for (const match of trimmed.matchAll(REFRESH_INTERVAL_SEGMENT_PATTERN)) {
    matchedText += match[0];
    if (Number(match[1]) > 0) hasPositiveSegment = true;
  }

  return matchedText === trimmed && hasPositiveSegment
    ? null
    : 'auth_files.refresh_interval_invalid';
};

export const createForkAuthFileEditorState = (): ForkAuthFileEditorState => ({
  refreshInterval: '',
  refreshIntervalTouched: false,
  refreshIntervalError: null,
});

export const readForkAuthFileEditorState = (
  json: Record<string, unknown>,
  resolveError: ResolveRefreshIntervalError
): ForkAuthFileEditorState => {
  const refreshInterval = readRefreshInterval(json);
  const refreshIntervalError = validateRefreshIntervalText(refreshInterval);
  return {
    refreshInterval,
    refreshIntervalTouched: false,
    refreshIntervalError: refreshIntervalError ? resolveError(refreshIntervalError) : null,
  };
};

export const hasForkAuthFileValidationError = (
  editor: ForkAuthFileEditorState | null
): boolean => Boolean(editor?.refreshIntervalTouched && editor.refreshIntervalError);

export const updateForkAuthFileEditorState = <T extends ForkAuthFileEditorState>(
  editor: T,
  field: string,
  value: string | boolean,
  resolveError: ResolveRefreshIntervalError
): T | null => {
  if (field === 'refreshInterval') {
    const refreshInterval = String(value);
    const errorKey = validateRefreshIntervalText(refreshInterval);
    return {
      ...editor,
      refreshInterval,
      refreshIntervalTouched: true,
      refreshIntervalError: errorKey ? resolveError(errorKey) : null,
    };
  }
  return null;
};

export const extendAuthFileFieldsPatch = (
  editor: ForkAuthFileEditorContext,
  patch: AuthFileFieldsPatch,
  resolveError: ResolveRefreshIntervalError
): void => {
  const original = editor.json ?? {};
  if (editor.refreshIntervalTouched) {
    const refreshInterval = editor.refreshInterval.trim();
    const errorKey = validateRefreshIntervalText(refreshInterval);
    if (errorKey) throw new Error(resolveError(errorKey));
    if (refreshInterval !== readRefreshInterval(original)) {
      patch.refresh_interval = refreshInterval;
    }
  }
};

export const applyForkAuthFilePreview = (
  value: Record<string, unknown>,
  patch: AuthFileFieldsPatch
): Record<string, unknown> => {
  if (patch.refresh_interval !== undefined) {
    if (patch.refresh_interval) value.refresh_interval = patch.refresh_interval;
    else delete value.refresh_interval;
  }
  return value;
};
