import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '@/components/ui/Select';
import type { ProviderKeyConfig } from '@/types';
import styles from './sharedForm.module.scss';

type CodexKeyBehavior = Pick<
  ProviderKeyConfig,
  'disableCodexCloaking' | 'streamBootstrapBuffering'
>;

interface CodexApiKeySettingsProps extends CodexKeyBehavior {
  disabled: boolean;
  onChange: (patch: Partial<CodexKeyBehavior>) => void;
}

export function CodexApiKeySettings({
  disableCodexCloaking,
  streamBootstrapBuffering,
  disabled,
  onChange,
}: CodexApiKeySettingsProps) {
  const { t } = useTranslation();
  const id = useId();
  const fields = [
    {
      key: 'disableCodexCloaking',
      value: disableCodexCloaking,
      label: 'codexKeyCloakingLabel',
      hint: 'codexKeyCloakingHint',
      inverted: true,
    },
    {
      key: 'streamBootstrapBuffering',
      value: streamBootstrapBuffering,
      label: 'bufferingLabel',
      hint: 'codexKeyBufferingHint',
      inverted: false,
    },
  ] as const;

  return fields.map((field) => (
    <div className={styles.field} key={field.key}>
      <label id={`${id}-${field.key}-label`} className={styles.label}>
        {t(`compatibilitySettings.${field.label}`)}
      </label>
      <Select
        id={`${id}-${field.key}`}
        value={field.value === undefined ? '' : String(field.value)}
        options={[
          { value: '', label: t('compatibilitySettings.codexKeyDefault') },
          {
            value: String(!field.inverted),
            label: t('compatibilitySettings.codexKeyOn'),
          },
          {
            value: String(field.inverted),
            label: t('compatibilitySettings.codexKeyOff'),
          },
        ]}
        onChange={(value) => onChange({ [field.key]: value === '' ? undefined : value === 'true' })}
        disabled={disabled}
        ariaLabelledBy={`${id}-${field.key}-label`}
        ariaDescribedBy={`${id}-${field.key}-hint`}
      />
      <small id={`${id}-${field.key}-hint`} className={styles.labelHint}>
        {t(`compatibilitySettings.${field.hint}`)}
      </small>
    </div>
  ));
}
