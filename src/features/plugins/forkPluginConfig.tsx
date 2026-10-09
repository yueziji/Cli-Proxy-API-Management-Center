import type { PluginConfigField, PluginListEntry } from '@/types';
import { ModelRetryOverridesEditor } from './components/ModelRetryOverridesEditor';
import { PluginJsonFieldEditor } from './components/PluginJsonFieldEditor';
import { normalizePluginConfigFieldType, type PluginConfigDraft } from './pluginConfigDraft';
import {
  MODEL_RETRY_OVERRIDES_FIELD,
  modelRetryFields,
  supportsModelRetryEditor,
  validateModelRetryDraft,
} from './modelRetryOverrides';

type Plugin = Pick<PluginListEntry, 'id' | 'configFields'>;
type Translate = Parameters<typeof validateModelRetryDraft>[1];
type UpdateDraft = (updater: (current: PluginConfigDraft) => PluginConfigDraft) => void;

export function validateForkPluginDraft(
  plugin: Plugin,
  draft: PluginConfigDraft,
  t: Translate
): Record<string, string> {
  if (
    supportsModelRetryEditor(plugin) &&
    [MODEL_RETRY_OVERRIDES_FIELD, ...modelRetryFields.map(({ key }) => key)].some(
      (key) => draft.touchedFields[key]
    )
  ) {
    const error = validateModelRetryDraft(draft.values, t);
    if (error) return { [MODEL_RETRY_OVERRIDES_FIELD]: error };
  }
  return {};
}

/** Return null for fields handled by the upstream editor. */
export function renderForkPluginField(
  plugin: Plugin | null,
  field: PluginConfigField,
  draft: PluginConfigDraft,
  disabled: boolean,
  updateDraft: UpdateDraft
) {
  const value = draft.values[field.name];
  const textValue = typeof value === 'string' ? value : '';
  const error = draft.errors[field.name];

  if (plugin && supportsModelRetryEditor(plugin) && field.name === MODEL_RETRY_OVERRIDES_FIELD) {
    return (
      <ModelRetryOverridesEditor
        key={field.name}
        value={textValue}
        globalValues={draft.values}
        disabled={disabled}
        error={error}
        onChange={(nextValue) =>
          updateDraft((current) => ({
            ...current,
            values: { ...current.values, [field.name]: nextValue },
            errors: { ...current.errors, [field.name]: '' },
            touchedFields: { ...current.touchedFields, [field.name]: true },
          }))
        }
      />
    );
  }

  const fieldType = normalizePluginConfigFieldType(field);
  if (fieldType !== 'array' && fieldType !== 'object') return null;
  return (
    <PluginJsonFieldEditor
      key={field.name}
      name={field.name}
      fieldType={fieldType}
      value={textValue}
      description={field.description}
      error={error}
      disabled={disabled}
      onChange={(nextValue, editorError = '') =>
        updateDraft((current) => ({
          ...current,
          values: { ...current.values, [field.name]: nextValue },
          errors: { ...current.errors, [field.name]: editorError },
          editorErrors: { ...current.editorErrors, [field.name]: editorError },
          touchedFields: { ...current.touchedFields, [field.name]: true },
        }))
      }
    />
  );
}
