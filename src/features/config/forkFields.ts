import type { ConfigFieldSearchEntry } from './searchIndex';

// Keep fork registrations together; upstream registries only need spread entries.
export const FORK_COMMON_FIELD_IDS = ['requestLog'] as const;

export const FORK_CONFIG_SEARCH_ENTRIES: Record<'advanced' | 'logging', ConfigFieldSearchEntry[]> =
  {
    advanced: [
      {
        fieldId: 'codexIdentityConfuse',
        sectionId: 'advanced',
        labelKey: 'compatibilitySettings.identityLabel',
        hintKey: 'compatibilitySettings.identityHint',
        qualifierKey: 'compatibilitySettings.codexTitle',
        yamlKeys: ['codex', 'identity-confuse'],
      },
      {
        fieldId: 'codexDisableCloaking',
        sectionId: 'advanced',
        labelKey: 'compatibilitySettings.cloakingLabel',
        hintKey: 'compatibilitySettings.cloakingHint',
        qualifierKey: 'compatibilitySettings.codexTitle',
        yamlKeys: ['codex', 'disable-codex-cloaking'],
      },
      {
        fieldId: 'codexStreamBootstrapBuffering',
        sectionId: 'advanced',
        labelKey: 'compatibilitySettings.bufferingLabel',
        hintKey: 'compatibilitySettings.bufferingHint',
        qualifierKey: 'compatibilitySettings.codexTitle',
        yamlKeys: ['codex', 'stream-bootstrap-buffering'],
      },
    ],
    logging: [
      {
        fieldId: 'requestLog',
        sectionId: 'logging',
        labelKey: 'config_management.visual.sections.system.request_log',
        hintKey: 'config_management.visual.sections.system.request_log_desc',
        yamlKeys: ['request-log'],
      },
    ],
  };

export const FORK_FIELD_VALUE_KEYS: Record<string, readonly string[]> = Object.fromEntries(
  Object.values(FORK_CONFIG_SEARCH_ENTRIES)
    .flat()
    .map(({ fieldId }) => [fieldId, [fieldId]])
);
