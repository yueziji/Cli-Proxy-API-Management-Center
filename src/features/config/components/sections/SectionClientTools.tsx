import { useTranslation } from 'react-i18next';
import { Collapsible } from '@/components/ui/Collapsible';
import type { ConfigSectionProps } from '../../types';
import { FieldStack, SettingList, TextSetting, ToggleSetting } from '../fields/FieldPrimitives';
import { getValidationMessage } from '../blocks/shared';

export function SectionClientTools({
  values,
  validationErrors,
  disabled,
  onChange,
}: ConfigSectionProps) {
  const { t } = useTranslation();
  return (
    <Collapsible label={t('config_management.visual.additions.clientToolsTitle')}>
      <FieldStack>
        <SettingList title={t('config_management.visual.additions.codexTitle')}>
          <ToggleSetting
            fieldId="codexEnableApplyPatch"
            label={t('config_management.visual.additions.codexEnableApplyPatch.label')}
            description={t('config_management.visual.additions.codexEnableApplyPatch.hint')}
            checked={values.codexEnableApplyPatch}
            disabled={disabled}
            onChange={(codexEnableApplyPatch) => onChange({ codexEnableApplyPatch })}
          />
          <ToggleSetting
            fieldId="codexWebSearchResultCacheEnabled"
            label={t('config_management.visual.additions.codexWebSearchResultCacheEnabled.label')}
            description={t(
              'config_management.visual.additions.codexWebSearchResultCacheEnabled.hint'
            )}
            checked={values.codexWebSearchResultCacheEnabled}
            disabled={disabled}
            onChange={(codexWebSearchResultCacheEnabled) =>
              onChange({ codexWebSearchResultCacheEnabled })
            }
          />
          <TextSetting
            fieldId="codexWebSearchResultCacheTTL"
            size="sm"
            label={t('config_management.visual.additions.codexWebSearchResultCacheTTL.label')}
            description={t('config_management.visual.additions.codexWebSearchResultCacheTTL.hint')}
            placeholder="24h"
            value={values.codexWebSearchResultCacheTTL}
            disabled={disabled}
            onChange={(codexWebSearchResultCacheTTL) => onChange({ codexWebSearchResultCacheTTL })}
            error={getValidationMessage(t, validationErrors?.codexWebSearchResultCacheTTL)}
          />
          <TextSetting
            fieldId="codexWebSearchResultCacheLimit"
            size="sm"
            label={t('config_management.visual.additions.codexWebSearchResultCacheLimit.label')}
            description={t(
              'config_management.visual.additions.codexWebSearchResultCacheLimit.hint'
            )}
            type="number"
            placeholder="1024"
            value={values.codexWebSearchResultCacheLimit}
            disabled={disabled}
            onChange={(codexWebSearchResultCacheLimit) =>
              onChange({ codexWebSearchResultCacheLimit })
            }
            error={getValidationMessage(t, validationErrors?.codexWebSearchResultCacheLimit)}
          />
        </SettingList>
        <SettingList title={t('config_management.visual.additions.claudeTitle')}>
          <ToggleSetting
            fieldId="claudeToolSearch"
            label={t('config_management.visual.additions.claudeToolSearch.label')}
            description={t('config_management.visual.additions.claudeToolSearch.hint')}
            checked={values.claudeToolSearch}
            disabled={disabled}
            onChange={(claudeToolSearch) => onChange({ claudeToolSearch })}
          />
        </SettingList>
      </FieldStack>
    </Collapsible>
  );
}
