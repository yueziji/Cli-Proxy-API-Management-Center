import { useTranslation } from 'react-i18next';
import { Collapsible } from '@/components/ui/Collapsible';
import type { ConfigSectionProps } from '../../types';
import { FieldAnchor, FieldStack, ToggleRow } from '../fields/FieldPrimitives';

export function CodexBehaviorSettings({ values, disabled, onChange }: ConfigSectionProps) {
  const { t } = useTranslation();

  return (
    <Collapsible label={t('compatibilitySettings.codexTitle')} defaultOpen={false}>
      <FieldStack>
        <FieldAnchor fieldId="codexDisableCloaking">
          <ToggleRow
            title={t('compatibilitySettings.cloakingLabel')}
            description={t('compatibilitySettings.cloakingHint')}
            checked={values.codexDisableCloaking}
            disabled={disabled}
            onChange={(codexDisableCloaking) => onChange({ codexDisableCloaking })}
          />
        </FieldAnchor>
        <FieldAnchor fieldId="codexStreamBootstrapBuffering">
          <ToggleRow
            title={t('compatibilitySettings.bufferingLabel')}
            description={t('compatibilitySettings.bufferingHint')}
            checked={values.codexStreamBootstrapBuffering}
            disabled={disabled}
            onChange={(codexStreamBootstrapBuffering) =>
              onChange({ codexStreamBootstrapBuffering })
            }
          />
        </FieldAnchor>
      </FieldStack>
    </Collapsible>
  );
}
