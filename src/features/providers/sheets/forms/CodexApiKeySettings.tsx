import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '@/components/ui/Select';
import { FieldLabel } from '@/components/ui/FieldLabel';
import type { ProviderKeyConfig } from '@/types';
import styles from './sharedForm.module.scss';

type CodexKeyBehavior = Pick<ProviderKeyConfig, 'disableCodexCloaking'>;

interface CodexApiKeySettingsProps extends CodexKeyBehavior {
  disabled: boolean;
  onChange: (patch: Partial<CodexKeyBehavior>) => void;
}

export function CodexApiKeySettings({
  disableCodexCloaking,
  disabled,
  onChange,
}: CodexApiKeySettingsProps) {
  const { t } = useTranslation();
  const id = useId();

  return (
    <div className={styles.field}>
      <FieldLabel
        id={`${id}-disableCodexCloaking-label`}
        htmlFor={`${id}-disableCodexCloaking`}
        className={styles.labelLine}
        labelClassName={styles.label}
        label={t('compatibilitySettings.codexKeyCloakingLabel')}
        hint={t('compatibilitySettings.codexKeyCloakingHint')}
        hintId={`${id}-disableCodexCloaking-hint`}
      />
      <Select
        id={`${id}-disableCodexCloaking`}
        value={disableCodexCloaking === undefined ? '' : String(disableCodexCloaking)}
        options={[
          { value: '', label: t('compatibilitySettings.codexKeyDefault') },
          {
            value: 'false',
            label: t('compatibilitySettings.codexKeyOn'),
          },
          {
            value: 'true',
            label: t('compatibilitySettings.codexKeyOff'),
          },
        ]}
        onChange={(value) =>
          onChange({ disableCodexCloaking: value === '' ? undefined : value === 'true' })
        }
        disabled={disabled}
        ariaLabelledBy={`${id}-disableCodexCloaking-label`}
        ariaDescribedBy={`${id}-disableCodexCloaking-hint`}
      />
    </div>
  );
}
