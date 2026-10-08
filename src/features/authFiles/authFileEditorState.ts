import type { AuthFileFieldsPatch } from '@/services/api';
import { goDurationSeconds } from '@/features/config/visualConfigAdditions';

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
  'refresh_interval_seconds',
  'refreshIntervalSeconds',
  'refresh_interval',
  'refreshInterval',
] as const;

// Match the backend's positive Go duration or numeric-seconds interpretation.
const validRefreshInterval = (text: string): boolean => {
  const duration = goDurationSeconds(text);
  if (duration !== undefined) return duration > 0;
  if (!/^\+?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) return false;
  const nanos = Number(text) * 1e9;
  return Number.isFinite(nanos) && nanos >= 1 && nanos < 2 ** 63;
};

const readRefreshInterval = (value: Record<string, unknown>): string => {
  for (const key of REFRESH_INTERVAL_KEYS) {
    const raw = value[key];
    const text = typeof raw === 'string' || typeof raw === 'number' ? String(raw).trim() : '';
    if (validRefreshInterval(text)) return text;
  }
  return '';
};

const validateRefreshIntervalText = (value: string): ForkAuthFileEditorErrorKey | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  return validRefreshInterval(trimmed) ? null : 'auth_files.refresh_interval_invalid';
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

export const hasForkAuthFileValidationError = (editor: ForkAuthFileEditorState | null): boolean =>
  Boolean(editor?.refreshIntervalTouched && editor.refreshIntervalError);

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
      patch.refresh_interval = refreshInterval || null;
      // Metadata PATCH retains null. Invalidate existing aliases so the backend
      // cannot keep using a higher-priority value or revive a cleared override.
      for (const key of REFRESH_INTERVAL_KEYS) {
        if (key !== 'refresh_interval' && Object.prototype.hasOwnProperty.call(original, key)) {
          patch[key] = null;
        }
      }
    }
  }
};

export const applyForkAuthFilePreview = (
  value: Record<string, unknown>,
  patch: AuthFileFieldsPatch
): Record<string, unknown> => {
  for (const key of REFRESH_INTERVAL_KEYS) {
    if (patch[key] !== undefined) value[key] = patch[key];
  }
  return value;
};
