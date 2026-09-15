import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { PluginDraftValue } from '../pluginConfigDraft';
import {
  configuredRetryModels,
  globalRetryValue,
  modelRetryDefaults,
  modelRetryFieldMode,
  modelRetryFields,
  normalizeRetryModel,
  parseRetryList,
  parseRetryNumber,
  readModelRetryOverrides,
  removeModelRetryOverride,
  setModelRetryField,
  type ModelRetryField,
  type ModelRetryOverrides,
} from '../modelRetryOverrides';
import styles from './ModelRetryOverridesEditor.module.scss';

interface EditorProps {
  value: string;
  globalValues: Record<string, PluginDraftValue>;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

function RetryFieldControl({
  field,
  model,
  value,
  globalValue,
  usesPluginDefault,
  onChange,
  disabled,
}: {
  field: ModelRetryField;
  model: string;
  value: unknown;
  globalValue: unknown;
  usesPluginDefault: boolean;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const id = useId();
  const [editingCustom, setEditingCustom] = useState(false);
  const mode = editingCustom ? 'custom' : modelRetryFieldMode(value, field);
  const label = t(`modelRetryOverrides.${field.key}`);
  const inheritedText = Array.isArray(globalValue)
    ? globalValue.length
      ? globalValue.join(', ')
      : t('modelRetryOverrides.off')
    : field.unlimited && globalValue === 0
      ? t('modelRetryOverrides.unlimited')
      : String(globalValue);
  const options = [
    { value: 'inherit', label: t('modelRetryOverrides.inherit') },
    { value: 'custom', label: t('modelRetryOverrides.custom') },
    ...(field.unlimited ? [{ value: 'unlimited', label: t('modelRetryOverrides.unlimited') }] : []),
    ...(field.kind === 'list' ? [{ value: 'off', label: t('modelRetryOverrides.off') }] : []),
  ];

  const changeMode = (nextMode: string) => {
    if (nextMode === mode) return;
    setEditingCustom(nextMode === 'custom');
    if (nextMode === 'inherit') onChange(undefined);
    else if (nextMode === 'unlimited') onChange(0);
    else if (nextMode === 'off') onChange([]);
    else if (field.kind === 'number') {
      onChange(
        typeof globalValue === 'number' && globalValue > 0
          ? globalValue
          : field.key === 'max_attempts'
            ? 3
            : 60000
      );
    } else {
      const candidate = Array.isArray(globalValue) ? globalValue : [globalValue];
      onChange(
        candidate.length ? [...candidate] : [...(modelRetryDefaults[field.key] as unknown[])]
      );
    }
  };

  const listText = Array.isArray(value)
    ? value.join(field.key === 'retry_keywords' ? '\n' : ', ')
    : value === null || value === undefined
      ? ''
      : String(value);

  return (
    <div className={styles.field}>
      <label id={`${id}-label`} htmlFor={`${id}-mode`}>
        {label}
      </label>
      <Select
        id={`${id}-mode`}
        value={mode}
        options={options}
        onChange={changeMode}
        disabled={disabled}
        ariaLabel={t('modelRetryOverrides.modeLabel', { model, field: label })}
        ariaDescribedBy={`${id}-hint`}
      />
      {mode === 'inherit' ? (
        <div className={styles.inherited}>
          {t(
            usesPluginDefault
              ? 'modelRetryOverrides.pluginDefault'
              : 'modelRetryOverrides.inheritedValue',
            { value: inheritedText }
          )}
        </div>
      ) : null}
      {mode === 'custom' && field.kind === 'number' ? (
        <Input
          key="number"
          aria-label={t('modelRetryOverrides.valueLabel', { model, field: label })}
          aria-describedby={`${id}-hint`}
          inputMode="numeric"
          defaultValue={value === null || value === undefined ? '' : String(value)}
          disabled={disabled}
          onChange={(event) => {
            setEditingCustom(true);
            onChange(parseRetryNumber(event.target.value));
          }}
        />
      ) : null}
      {mode === 'custom' && field.kind === 'list' ? (
        <textarea
          key="list"
          className={`input ${styles.listInput}`}
          aria-label={t('modelRetryOverrides.valueLabel', { model, field: label })}
          aria-describedby={`${id}-hint`}
          defaultValue={listText}
          disabled={disabled}
          spellCheck={false}
          rows={field.key === 'retry_keywords' ? 3 : 2}
          onChange={(event) => {
            setEditingCustom(true);
            onChange(parseRetryList(event.target.value, field.key));
          }}
        />
      ) : null}
      <div id={`${id}-hint`} className={styles.hint}>
        {t(`modelRetryOverrides.${field.key}Hint`)}
      </div>
    </div>
  );
}

export function ModelRetryOverridesEditor({
  value,
  globalValues,
  onChange,
  disabled,
  error,
}: EditorProps) {
  const { t } = useTranslation();
  const id = useId();
  const [showJSON, setShowJSON] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const overrides = readModelRetryOverrides(value);
  const models = configuredRetryModels(globalValues.models);
  const configured = new Set(models.map(normalizeRetryModel));
  const existing = new Set(Object.keys(overrides ?? {}).map(normalizeRetryModel));
  const available = models.filter((model) => !existing.has(normalizeRetryModel(model)));
  const structured = overrides !== null && !showJSON;
  const updateOverrides = (next: ModelRetryOverrides) => onChange(JSON.stringify(next, null, 2));

  return (
    <section className={styles.editor} aria-labelledby={`${id}-title`}>
      <div className={styles.header}>
        <h4 id={`${id}-title`}>{t('modelRetryOverrides.title')}</h4>
        <div className={styles.tabs}>
          <Button
            type="button"
            size="sm"
            variant={structured ? 'secondary' : 'ghost'}
            disabled={disabled || overrides === null}
            aria-pressed={structured}
            onClick={() => setShowJSON(false)}
          >
            {t('modelRetryOverrides.form')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={structured ? 'ghost' : 'secondary'}
            disabled={disabled}
            aria-pressed={!structured}
            onClick={() => setShowJSON(true)}
          >
            {t('modelRetryOverrides.json')}
          </Button>
        </div>
      </div>
      <p className={styles.hint}>{t('modelRetryOverrides.description')}</p>
      {structured ? (
        <>
          {Object.keys(overrides).length === 0 ? (
            <p className={styles.empty}>{t('modelRetryOverrides.empty')}</p>
          ) : null}
          {Object.entries(overrides).map(([model, policy]) => (
            <fieldset key={model} className={styles.model} disabled={disabled}>
              <legend>{model}</legend>
              <div className={styles.modelHeader}>
                <span className={styles.hint}>
                  {configured.has(normalizeRetryModel(model))
                    ? ''
                    : t('modelRetryOverrides.unconfigured')}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  aria-label={t('modelRetryOverrides.restoreLabel', { model })}
                  onClick={() => updateOverrides(removeModelRetryOverride(overrides, model))}
                >
                  {t('modelRetryOverrides.restore')}
                </Button>
              </div>
              <div className={styles.fields}>
                {modelRetryFields.map((field) => (
                  <RetryFieldControl
                    key={field.key}
                    field={field}
                    model={model}
                    value={policy?.[field.key]}
                    globalValue={globalRetryValue(globalValues, field.key)}
                    usesPluginDefault={!String(globalValues[field.key] ?? '').trim()}
                    disabled={disabled}
                    onChange={(next) =>
                      updateOverrides(setModelRetryField(overrides, model, field.key, next))
                    }
                  />
                ))}
              </div>
            </fieldset>
          ))}
          <div className={styles.addRow}>
            <Select
              value={selectedModel}
              options={available.map((model) => ({ value: model, label: model }))}
              placeholder={t('modelRetryOverrides.selectModel')}
              ariaLabel={t('modelRetryOverrides.selectModel')}
              disabled={disabled || available.length === 0}
              onChange={setSelectedModel}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={disabled || !available.includes(selectedModel)}
              onClick={() => {
                updateOverrides({ ...overrides, [selectedModel]: {} });
                setSelectedModel('');
              }}
            >
              {t('modelRetryOverrides.addModel')}
            </Button>
          </div>
          {models.length === 0 ? (
            <p className={styles.hint}>{t('modelRetryOverrides.noModels')}</p>
          ) : null}
          {models.length > 0 && available.length === 0 ? (
            <p className={styles.hint}>{t('modelRetryOverrides.noMoreModels')}</p>
          ) : null}
        </>
      ) : (
        <div className={styles.raw}>
          <label htmlFor={`${id}-json`}>{t('modelRetryOverrides.jsonLabel')}</label>
          <textarea
            id={`${id}-json`}
            className={`input ${styles.jsonInput}`}
            value={value}
            disabled={disabled}
            aria-describedby={`${id}-json-hint`}
            spellCheck={false}
            placeholder="{}"
            onChange={(event) => onChange(event.target.value)}
          />
          <p id={`${id}-json-hint`} className={styles.hint}>
            {t('modelRetryOverrides.jsonHint')}
          </p>
          {!overrides ? (
            <p className="error-box" role="alert">
              {t('modelRetryOverrides.invalidObject')}
            </p>
          ) : null}
        </div>
      )}
      {error ? (
        <p className="error-box" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
