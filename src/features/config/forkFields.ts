import type { ConfigFieldSearchEntry } from './searchIndex';

// Keep fork registrations together; upstream registries only need spread entries.
export const FORK_COMMON_FIELD_IDS = ['requestLog'] as const;

export const FORK_CONFIG_SEARCH_ENTRIES: Record<'logging', ConfigFieldSearchEntry[]> = {
  logging: [
    {
      fieldId: 'requestLog',
      sectionId: 'logging',
      labelKey: 'config_management.visual.sections.system.request_log',
      hintKey: 'config_management.visual.sections.system.request_log_desc',
      yamlKeys: ['observability', 'logs', 'request-log'],
    },
  ],
};

export const FORK_FIELD_VALUE_KEYS: Record<string, readonly string[]> = Object.fromEntries(
  Object.values(FORK_CONFIG_SEARCH_ENTRIES)
    .flat()
    .map(({ fieldId }) => [fieldId, [fieldId]])
);
