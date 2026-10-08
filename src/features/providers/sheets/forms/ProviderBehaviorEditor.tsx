import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Collapsible } from '@/components/ui/Collapsible';
import type { ProviderBehaviorOptions } from '@/types/provider';
import { getProviderBehaviorCapabilities } from '../../descriptors';
import type { ProviderBrand } from '../../types';
import { CodexApiKeySettings } from './CodexApiKeySettings';
import styles from './sharedForm.module.scss';

interface ProviderBehaviorEditorProps {
  brand: ProviderBrand;
  value: ProviderBehaviorOptions;
  onChange: (patch: Partial<ProviderBehaviorOptions>) => void;
  disabled: boolean;
}

export function ProviderBehaviorEditor({
  brand,
  value,
  onChange,
  disabled,
}: ProviderBehaviorEditorProps) {
  const { t } = useTranslation();
  const id = useId();
  const capabilities = getProviderBehaviorCapabilities(brand);
  if (!Object.values(capabilities).some(Boolean)) return null;
  const checkbox = (key: 'alphaSearch' | 'rebuildMidSystemMessage' | 'supportPromptCacheKey') => (
    <label className={styles.checkboxRow}>
      <input
        type="checkbox"
        className={styles.checkboxBox}
        checked={value[key] === true}
        disabled={disabled}
        aria-describedby={`${id}-${key}-hint`}
        onChange={(event) => onChange({ [key]: event.target.checked })}
      />
      <span className={styles.checkboxText}>
        <span>{t(`providersPage.behavior.${key}`)}</span>
        <small id={`${id}-${key}-hint`}>{t(`providersPage.behavior.${key}Hint`)}</small>
      </span>
    </label>
  );
  return (
    <Collapsible label={t('providersPage.behavior.title')}>
      <div className={styles.section}>
        {capabilities.alphaSearch ? checkbox('alphaSearch') : null}
        {capabilities.disableCodexCloaking ? (
          <CodexApiKeySettings
            disableCodexCloaking={value.disableCodexCloaking}
            disabled={disabled}
            onChange={onChange}
          />
        ) : null}
        {capabilities.rebuildMidSystemMessage ? checkbox('rebuildMidSystemMessage') : null}
        {capabilities.supportPromptCacheKey ? checkbox('supportPromptCacheKey') : null}
      </div>
    </Collapsible>
  );
}
