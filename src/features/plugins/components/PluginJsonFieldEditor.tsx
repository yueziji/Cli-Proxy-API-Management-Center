import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import {
  formatPluginJson,
  inspectPluginJsonField,
  isEditableJsonNumber,
  serializePluginJsonRows,
  type PluginJsonFieldType,
  type PluginJsonRow,
  type PluginJsonValueType,
} from '../pluginJsonFields';
import styles from './PluginJsonFieldEditor.module.scss';

interface EditorProps {
  name: string;
  fieldType: PluginJsonFieldType;
  value: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string, editorError?: string) => void;
}

const initialValues: Record<PluginJsonValueType, string> = {
  string: '',
  number: '0',
  boolean: 'false',
  null: 'null',
};

export function PluginJsonFieldEditor({
  name,
  fieldType,
  value,
  description,
  error,
  disabled,
  onChange,
}: EditorProps) {
  const { t } = useTranslation();
  const id = useId();
  const nextRowID = useRef(0);
  const [showJSON, setShowJSON] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<PluginJsonValueType | ''>('');
  // Keep unfinished numeric input visible without submitting a stale valid value.
  // A different source (for example, an edit in JSON mode) replaces this draft.
  const [edited, setEdited] = useState<{ source: string; rows: PluginJsonRow[] } | null>(null);
  const inspected = inspectPluginJsonField(value, fieldType);
  const rows = edited?.source === value ? edited.rows : inspected.rows;
  const structured = !showJSON && rows !== null;
  const invalidNumber =
    rows?.findIndex((row) => row.type === 'number' && !isEditableJsonNumber(row.value)) ?? -1;
  const itemLabel = (row: PluginJsonRow, index: number) =>
    fieldType === 'array' ? t('pluginJsonEditor.item', { index: index + 1 }) : row.name || '""';
  const numberError = (items: PluginJsonRow[], index: number) =>
    t('pluginJsonEditor.invalidNumber', { item: itemLabel(items[index], index) });
  const editorError = rows && invalidNumber !== -1 ? numberError(rows, invalidNumber) : '';
  const errorText = editorError || (inspected.error ? t(inspected.error) : '') || error;
  const duplicateName = Boolean(newName && rows?.some((row) => row.name === newName));
  const isUnset = !value.trim();
  const typeOptions = (Object.keys(initialValues) as PluginJsonValueType[]).map((type) => ({
    value: type,
    label: t(`pluginJsonEditor.${type}`),
  }));

  const changeRows = (next: PluginJsonRow[]) => {
    const result = serializePluginJsonRows(next, fieldType);
    const nextValue = result.invalidNumber === null ? result.text : value;
    setEdited({ source: nextValue, rows: next });
    onChange(
      nextValue,
      result.invalidNumber === null ? '' : numberError(next, result.invalidNumber)
    );
  };

  const changeText = (nextValue: string) => {
    setEdited(null);
    onChange(nextValue, '');
  };

  return (
    <section className={styles.editor} aria-labelledby={`${id}-title`}>
      <div className={styles.header}>
        <h4 id={`${id}-title`}>{name}</h4>
        <div className={styles.actions}>
          <Button
            type="button"
            size="sm"
            variant={structured ? 'secondary' : 'ghost'}
            aria-pressed={structured}
            disabled={disabled || rows === null}
            onClick={() => setShowJSON(false)}
          >
            {t('pluginJsonEditor.form')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={structured ? 'ghost' : 'secondary'}
            aria-pressed={!structured}
            disabled={disabled || Boolean(editorError)}
            onClick={() => setShowJSON(true)}
          >
            JSON
          </Button>
          {!isUnset ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled}
              onClick={() => changeText('')}
            >
              {t('pluginJsonEditor.unset')}
            </Button>
          ) : null}
        </div>
      </div>
      {description ? <p className={styles.hint}>{description}</p> : null}
      {structured ? (
        <>
          {rows.length === 0 ? (
            <div className={styles.empty}>
              <span>
                {t(
                  isUnset
                    ? 'pluginJsonEditor.notSet'
                    : fieldType === 'array'
                      ? 'pluginJsonEditor.emptyArray'
                      : 'pluginJsonEditor.emptyObject'
                )}
              </span>
              {isUnset ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => changeRows([])}
                >
                  {t(
                    fieldType === 'array'
                      ? 'pluginJsonEditor.setEmptyArray'
                      : 'pluginJsonEditor.setEmptyObject'
                  )}
                </Button>
              ) : null}
            </div>
          ) : null}
          <div className={styles.rows}>
            {rows.map((row, index) => {
              const item = itemLabel(row, index);
              const valueLabel = t('pluginJsonEditor.valueLabel', { field: name, item });
              const invalid = row.type === 'number' && !isEditableJsonNumber(row.value);
              const updateValue = (nextValue: string) =>
                changeRows(
                  rows.map((entry) =>
                    entry.id === row.id ? { ...entry, value: nextValue } : entry
                  )
                );
              return (
                <div key={row.id} className={styles.row} role="group" aria-label={valueLabel}>
                  <div className={styles.rowLabel}>
                    <span>{item}</span>
                    <span className={styles.type}>{t(`pluginJsonEditor.${row.type}`)}</span>
                  </div>
                  <div className={styles.value}>
                    {row.type === 'string' ? (
                      <textarea
                        className={`input ${styles.stringInput}`}
                        aria-label={valueLabel}
                        value={row.value}
                        rows={Math.min(4, row.value.split('\n').length)}
                        spellCheck={false}
                        disabled={disabled}
                        onChange={(event) => updateValue(event.target.value)}
                      />
                    ) : row.type === 'number' ? (
                      <Input
                        aria-label={valueLabel}
                        aria-invalid={invalid}
                        aria-describedby={invalid ? `${id}-error` : undefined}
                        inputMode="decimal"
                        value={row.value}
                        disabled={disabled}
                        onChange={(event) => updateValue(event.target.value)}
                      />
                    ) : row.type === 'boolean' ? (
                      <ToggleSwitch
                        ariaLabel={valueLabel}
                        checked={row.value === 'true'}
                        disabled={disabled}
                        onChange={(checked) => updateValue(String(checked))}
                      />
                    ) : (
                      <code>null</code>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={t('pluginJsonEditor.removeLabel', { field: name, item })}
                    disabled={disabled}
                    onClick={() => changeRows(rows.filter((entry) => entry.id !== row.id))}
                  >
                    {t('pluginJsonEditor.remove')}
                  </Button>
                </div>
              );
            })}
          </div>
          <div className={styles.addRow}>
            {fieldType === 'object' ? (
              <Input
                aria-label={t('pluginJsonEditor.nameLabel', { field: name })}
                placeholder={t('pluginJsonEditor.fieldName')}
                value={newName}
                disabled={disabled}
                error={duplicateName ? t('pluginJsonEditor.duplicateName') : undefined}
                onChange={(event) => setNewName(event.target.value)}
              />
            ) : null}
            <Select
              value={newType}
              options={typeOptions}
              placeholder={t('pluginJsonEditor.chooseType')}
              ariaLabel={t('pluginJsonEditor.typeLabel', { field: name })}
              disabled={disabled}
              onChange={(type) => setNewType(type as PluginJsonValueType)}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={
                disabled ||
                !newType ||
                (fieldType === 'object' && (!newName.trim() || duplicateName))
              }
              onClick={() => {
                if (!newType) return;
                changeRows([
                  ...rows,
                  {
                    id: `added-${nextRowID.current++}`,
                    name: fieldType === 'object' ? newName : '',
                    type: newType,
                    value: initialValues[newType],
                  },
                ]);
                setNewName('');
              }}
            >
              {t(fieldType === 'array' ? 'pluginJsonEditor.addItem' : 'pluginJsonEditor.addField')}
            </Button>
          </div>
        </>
      ) : (
        <div className={styles.raw}>
          {rows === null && !inspected.error ? (
            <p className={styles.hint}>{t('pluginJsonEditor.jsonOnly')}</p>
          ) : null}
          <textarea
            className={`input ${styles.jsonInput}`}
            aria-label={t('pluginJsonEditor.jsonLabel', { field: name })}
            aria-invalid={Boolean(errorText)}
            aria-describedby={`${id}-json-hint${errorText ? ` ${id}-error` : ''}`}
            value={value}
            placeholder={fieldType === 'array' ? '[]' : '{}'}
            spellCheck={false}
            disabled={disabled}
            onChange={(event) => changeText(event.target.value)}
          />
          <div className={styles.header}>
            <p id={`${id}-json-hint`} className={styles.hint}>
              {t('pluginJsonEditor.jsonHint')}
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={disabled || isUnset || Boolean(inspected.error)}
              onClick={() => {
                const formatted = formatPluginJson(value);
                if (formatted !== null) changeText(formatted);
              }}
            >
              {t('pluginJsonEditor.format')}
            </Button>
          </div>
        </div>
      )}
      {errorText ? (
        <p id={`${id}-error`} className="error-box" role="alert">
          {errorText}
        </p>
      ) : null}
    </section>
  );
}
