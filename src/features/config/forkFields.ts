import type { ConfigFieldSearchEntry } from './searchIndex';

export const FORK_VISUAL_DEFAULTS = {
  requestLog: false,
  codexEnableApplyPatch: false,
  codexWebSearchResultCacheEnabled: false,
  codexWebSearchResultCacheTTL: '',
  codexWebSearchResultCacheLimit: '',
  routingSessionAffinityRebindOn: '',
  claudeToolSearch: false,
  streamingSendKeepAliveBeforeFT: false,
};

export type ForkVisualConfigValues = typeof FORK_VISUAL_DEFAULTS;

export const FORK_ADDITION_FIELDS = [
  {
    key: 'requestLog',
    path: 'observability.logs.request-log'.split('.'),
    kind: 'boolean',
  },
  {
    key: 'codexEnableApplyPatch',
    path: 'client.codex.enable-apply-patch'.split('.'),
    kind: 'boolean',
  },
  {
    key: 'codexWebSearchResultCacheEnabled',
    path: 'client.codex.web-search-result-cache.enabled'.split('.'),
    kind: 'boolean',
    // This cache block has a strict backend decoder, unlike typed YAML 1.1 booleans.
    read: (value: unknown) => value === true,
  },
  {
    key: 'codexWebSearchResultCacheTTL',
    path: 'client.codex.web-search-result-cache.ttl'.split('.'),
    kind: 'string',
  },
  {
    key: 'codexWebSearchResultCacheLimit',
    path: 'client.codex.web-search-result-cache.limit'.split('.'),
    kind: 'integer',
  },
  {
    key: 'routingSessionAffinityRebindOn',
    path: 'routing.session-affinity-rebind-on'.split('.'),
    kind: 'string',
  },
  {
    key: 'claudeToolSearch',
    path: 'upstream.claude.tool-search'.split('.'),
    kind: 'boolean',
  },
  {
    key: 'streamingSendKeepAliveBeforeFT',
    path: 'requests.streaming.send-keepalive-before-ft'.split('.'),
    kind: 'boolean',
  },
] as const;

// Keep fork registrations together; upstream registries only need spread entries.
export const FORK_COMMON_FIELD_IDS = ['requestLog'] as const;

export const FORK_CONFIG_SEARCH_ENTRIES: Record<
  'logging' | 'advanced' | 'network' | 'streaming',
  ConfigFieldSearchEntry[]
> = {
  advanced: [
    {
      fieldId: 'codexEnableApplyPatch',
      sectionId: 'advanced',
      labelKey: 'config_management.visual.additions.codexEnableApplyPatch.label',
      hintKey: 'config_management.visual.additions.codexEnableApplyPatch.hint',
      yamlKeys: ['client', 'codex', 'enable-apply-patch'],
    },
    {
      fieldId: 'codexWebSearchResultCacheEnabled',
      sectionId: 'advanced',
      labelKey: 'config_management.visual.additions.codexWebSearchResultCacheEnabled.label',
      hintKey: 'config_management.visual.additions.codexWebSearchResultCacheEnabled.hint',
      yamlKeys: ['client', 'codex', 'web-search-result-cache', 'enabled'],
    },
    {
      fieldId: 'codexWebSearchResultCacheTTL',
      sectionId: 'advanced',
      labelKey: 'config_management.visual.additions.codexWebSearchResultCacheTTL.label',
      hintKey: 'config_management.visual.additions.codexWebSearchResultCacheTTL.hint',
      yamlKeys: ['client', 'codex', 'web-search-result-cache', 'ttl'],
    },
    {
      fieldId: 'codexWebSearchResultCacheLimit',
      sectionId: 'advanced',
      labelKey: 'config_management.visual.additions.codexWebSearchResultCacheLimit.label',
      hintKey: 'config_management.visual.additions.codexWebSearchResultCacheLimit.hint',
      yamlKeys: ['client', 'codex', 'web-search-result-cache', 'limit'],
    },
    {
      fieldId: 'claudeToolSearch',
      sectionId: 'advanced',
      labelKey: 'config_management.visual.additions.claudeToolSearch.label',
      hintKey: 'config_management.visual.additions.claudeToolSearch.hint',
      yamlKeys: ['upstream', 'claude', 'tool-search'],
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
  network: [
    {
      fieldId: 'routingSessionAffinityRebindOn',
      sectionId: 'network',
      labelKey: 'config_management.visual.additions.routingSessionAffinityRebindOn.label',
      hintKey: 'config_management.visual.additions.routingSessionAffinityRebindOn.hint',
      yamlKeys: ['routing', 'session-affinity-rebind-on'],
    },
  ],
  streaming: [
    {
      fieldId: 'streamingSendKeepAliveBeforeFT',
      sectionId: 'streaming',
      labelKey: 'config_management.visual.additions.streamingSendKeepAliveBeforeFT.label',
      hintKey: 'config_management.visual.additions.streamingSendKeepAliveBeforeFT.hint',
      yamlKeys: ['requests', 'streaming', 'send-keepalive-before-ft'],
    },
  ],
};

export const FORK_FIELD_VALUE_KEYS: Record<string, readonly string[]> = Object.fromEntries(
  Object.values(FORK_CONFIG_SEARCH_ENTRIES)
    .flat()
    .map(({ fieldId }) => [fieldId, [fieldId]])
);
