import type { PluginListEntry } from '@/types';
import type { PluginDraftValue } from './pluginConfigDraft';
import { isRecord } from '@/utils/helpers';

export const MODEL_RETRY_OVERRIDES_FIELD = 'model_overrides';

export const modelRetryFields = [
  { key: 'max_attempts', kind: 'number', unlimited: true },
  { key: 'initial_delay_ms', kind: 'number', unlimited: false },
  { key: 'max_delay_ms', kind: 'number', unlimited: false },
  { key: 'max_elapsed_time_ms', kind: 'number', unlimited: true },
  { key: 'status_codes', kind: 'list', unlimited: false },
  { key: 'retry_keywords', kind: 'list', unlimited: false },
] as const;

export type ModelRetryField = (typeof modelRetryFields)[number];
export type ModelRetryFieldKey = ModelRetryField['key'];
export type ModelRetryPolicy = Record<string, unknown>;
export type ModelRetryOverrides = Record<string, ModelRetryPolicy | null>;
type DraftValues = Record<string, PluginDraftValue>;
type Translate = (key: string, options?: Record<string, unknown>) => string;

// The documented defaults of the model_overrides-capable retry plugin. Keep in
// sync with defaultPluginConfig in model-retry-wrapper-plugin/logic.go.
export const modelRetryDefaults: Record<ModelRetryFieldKey, number | number[] | string[]> = {
  max_attempts: 0,
  initial_delay_ms: 500,
  max_delay_ms: 10000,
  max_elapsed_time_ms: 0,
  status_codes: [408, 429, 500, 502, 503, 504],
  retry_keywords: ['rate_limited'],
};

const MAX_DURATION_MS = 9223372036854; // Go's maximum time.Duration in milliseconds.
export const normalizeRetryModel = (model: string): string => model.trim().toLowerCase();

export const supportsModelRetryEditor = (
  plugin: Pick<PluginListEntry, 'id' | 'configFields'>
): boolean =>
  plugin.id === 'model-retry-wrapper' &&
  plugin.configFields.some(
    (field) =>
      field.name === MODEL_RETRY_OVERRIDES_FIELD && field.type.trim().toLowerCase() === 'object'
  );

export function readModelRetryOverrides(text: string): ModelRetryOverrides | null {
  if (!text.trim()) return {};
  try {
    const value: unknown = JSON.parse(text);
    if (
      !isRecord(value) ||
      Object.values(value).some((policy) => policy !== null && !isRecord(policy))
    ) {
      return null;
    }
    return value as ModelRetryOverrides;
  } catch {
    return null;
  }
}

export function configuredRetryModels(value: PluginDraftValue | undefined): string[] {
  try {
    const models: unknown = JSON.parse(typeof value === 'string' ? value : '[]');
    if (!Array.isArray(models)) return [];
    const seen = new Set<string>();
    return models
      .filter((model): model is string => {
        if (typeof model !== 'string') return false;
        const normalized = normalizeRetryModel(model);
        if (!normalized || seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      })
      .map((model) => model.trim());
  } catch {
    return [];
  }
}

export function setModelRetryField(
  overrides: ModelRetryOverrides,
  model: string,
  field: ModelRetryFieldKey,
  value: unknown
): ModelRetryOverrides {
  const policy = overrides[model] ?? {};
  const nextPolicy =
    value === undefined
      ? Object.fromEntries(Object.entries(policy).filter(([key]) => key !== field))
      : { ...policy, [field]: value };
  return { ...overrides, [model]: nextPolicy };
}

export const removeModelRetryOverride = (
  overrides: ModelRetryOverrides,
  model: string
): ModelRetryOverrides =>
  Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== model));

export function globalRetryValue(values: DraftValues, field: ModelRetryFieldKey): unknown {
  const raw = values[field];
  if (typeof raw !== 'string' || !raw.trim()) return modelRetryDefaults[field];
  if (modelRetryFields.some((item) => item.key === field && item.kind === 'number')) {
    return parseRetryNumber(raw);
  }
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function modelRetryFieldMode(value: unknown, field: ModelRetryField): string {
  if (value === null || value === undefined) return 'inherit';
  if (field.unlimited && value === 0) return 'unlimited';
  if (field.kind === 'list' && Array.isArray(value) && value.length === 0) return 'off';
  return 'custom';
}

export function parseRetryNumber(text: string): number | string {
  return /^-?\d+$/.test(text.trim()) ? Number(text.trim()) : text;
}

export function parseRetryList(text: string, field: ModelRetryFieldKey): unknown[] {
  if (field === 'retry_keywords') {
    return text
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return text
    .split(/[,，\s]+/)
    .filter(Boolean)
    .map(parseRetryNumber);
}

export function validateModelRetryDraft(values: DraftValues, t: Translate): string | null {
  const raw = values[MODEL_RETRY_OVERRIDES_FIELD];
  const overrides = readModelRetryOverrides(typeof raw === 'string' ? raw : '');
  if (!overrides) return t('modelRetryOverrides.invalidObject');

  const globals = Object.fromEntries(
    modelRetryFields.map(({ key }) => [key, globalRetryValue(values, key)])
  );
  const validatePolicy = (policy: ModelRetryPolicy, model: string): string | null => {
    for (const field of modelRetryFields) {
      const value = policy[field.key];
      let valid: boolean;
      if (field.kind === 'number') {
        valid =
          typeof value === 'number' &&
          Number.isSafeInteger(value) &&
          value >= (field.unlimited ? 0 : 1) &&
          (field.key === 'max_attempts' || value <= MAX_DURATION_MS);
      } else if (field.key === 'retry_keywords') {
        valid = Array.isArray(value) && value.every((item) => typeof item === 'string');
      } else {
        const codes = Array.isArray(value) ? value : [value];
        valid = codes.every((item) => {
          const code = typeof item === 'string' && /^\d+$/.test(item.trim()) ? Number(item) : item;
          return typeof code === 'number' && Number.isInteger(code) && code >= 100 && code <= 599;
        });
      }
      if (!valid)
        return t('modelRetryOverrides.invalidField', {
          model,
          field: t(`modelRetryOverrides.${field.key}`),
        });
    }
    if ((policy.initial_delay_ms as number) > (policy.max_delay_ms as number)) {
      return t('modelRetryOverrides.delayOrder', { model });
    }
    return null;
  };

  const globalError = validatePolicy(globals, t('modelRetryOverrides.globalSettings'));
  if (globalError) return globalError;
  const seen = new Set<string>();
  for (const [model, policy] of Object.entries(overrides)) {
    const normalized = normalizeRetryModel(model);
    if (!normalized) return t('modelRetryOverrides.blankModel');
    if (seen.has(normalized)) return t('modelRetryOverrides.duplicateModel', { model });
    seen.add(normalized);
    const ownValues = Object.fromEntries(
      Object.entries(policy ?? {}).filter(([, value]) => value !== null)
    );
    const error = validatePolicy({ ...globals, ...ownValues }, model);
    if (error) return error;
  }
  return null;
}
