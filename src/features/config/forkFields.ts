import type { ConfigFieldSearchEntry } from './searchIndex';

export const FORK_VISUAL_DEFAULTS = {
  requestLog: false,
  codexEnableApplyPatch: false,
};

export type ForkVisualConfigValues = typeof FORK_VISUAL_DEFAULTS;

export const FORK_ADDITION_FIELDS = [
  {
    key: 'requestLog',
    path: 'observability.logs.request-log'.split('.'),
    kind: 'boolean',
    // Preserve the existing request-log coercion during this structural refactor.
    read: Boolean,
  },
  {
    key: 'codexEnableApplyPatch',
    path: 'client.codex.enable-apply-patch'.split('.'),
    kind: 'boolean',
  },
] as const;

// Keep fork registrations together; upstream registries only need spread entries.
export const FORK_COMMON_FIELD_IDS = ['requestLog'] as const;

export const FORK_CONFIG_SEARCH_ENTRIES: Record<'logging' | 'advanced', ConfigFieldSearchEntry[]> =
  {
    advanced: [
      {
        fieldId: 'codexEnableApplyPatch',
        sectionId: 'advanced',
        labelKey: 'config_management.visual.additions.codexEnableApplyPatch.label',
        hintKey: 'config_management.visual.additions.codexEnableApplyPatch.hint',
        yamlKeys: ['client', 'codex', 'enable-apply-patch'],
      },
    ],
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
