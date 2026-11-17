import { useTranslation } from 'react-i18next';
import { Collapsible } from '@/components/ui/Collapsible';
import type { ProviderBehaviorOptions } from '@/types/provider';
import { getProviderBehaviorCapabilities } from '../../descriptors';
import type { ProviderBrand } from '../../types';
import { CodexApiKeySettings } from './CodexApiKeySettings';
import { CheckboxField } from './CheckboxField';
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
  const capabilities = getProviderBehaviorCapabilities(brand);
  if (!Object.values(capabilities).some(Boolean)) return null;
  const checkbox = (key: 'alphaSearch' | 'rebuildMidSystemMessage' | 'supportPromptCacheKey') => (
    <CheckboxField
      label={t(`providersPage.behavior.${key}`)}
      hint={t(`providersPage.behavior.${key}Hint`)}
      checked={value[key] === true}
      disabled={disabled}
      onChange={(checked) => onChange({ [key]: checked })}
    />
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
