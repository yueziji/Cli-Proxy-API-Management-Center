import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { guardConfigConnection } from '@/services/api/configValue';
import { providersApi } from '@/services/api';
import { getErrorMessage } from '@/utils/helpers';
import { useAuthStore, useConfigStore } from '@/stores';
import { withDisableAllModelsRule } from '@/components/providers/utils';
import type {
  Config,
  ProviderSource,
  GeminiKeyConfig,
  ModelAlias,
  OpenAIProviderConfig,
  ProviderKeyConfig,
} from '@/types';
import {
  claudeToResource,
  codexToResource,
  geminiToResource,
  interactionsToResource,
  metaToResource,
  openaiToResource,
  vertexToResource,
  xaiToResource,
} from './adapters';
import { PROVIDER_BRAND_ORDER, PROVIDER_DESCRIPTORS } from './descriptors';
import { buildRuntimePolicy } from './runtimePolicy';
import { buildModelOptions } from './modelOptions';
import { pickProviderBehavior } from './providerBehavior';
import type {
  ProviderBrand,
  ProviderEntryFormInput,
  ProviderGroup,
  ProviderResource,
  ProviderSnapshot,
  NativeSection,
} from './types';

import type { NativeConnectionFormOutput } from './nativeConnectionForm';
import { buildNativeSections, isNativeFamily } from './nativeSections';
import type { NativeConnectionMember, NativeProviderFamily } from '@/services/api/providers';

export interface UseProviderWorkbenchResult {
  saveNativeConnection: (
    family: NativeProviderFamily,
    section: NativeSection | undefined,
    draft: NativeConnectionFormOutput
  ) => Promise<void>;
  deleteNativeConnection: (family: NativeProviderFamily, source: ProviderSource) => Promise<void>;
  setConnectionDisabled: (
    family: NativeProviderFamily,
    section: NativeSection,
    disabled: boolean
  ) => Promise<void>;
  connected: boolean;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  errorMessage: string | null;
  snapshot: ProviderSnapshot | null;
  refetch: () => Promise<void>;

  createProvider: (brand: ProviderBrand, input: ProviderEntryFormInput) => Promise<void>;
  updateProvider: (resource: ProviderResource, input: ProviderEntryFormInput) => Promise<void>;
  deleteProvider: (resource: ProviderResource) => Promise<void>;
  toggleDisabled: (resource: ProviderResource, disabled: boolean) => Promise<void>;
  mutating: boolean;
  refreshSnapshot: () => void;
}

/* -------------------------------------------------------------------------- */
/* form -> backend config 转换                                                 */
/* -------------------------------------------------------------------------- */

const parseTextList = (text: string): string[] =>
  text
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const headersFromEntries = (
  entries: Array<{ key: string; value: string }>
): Record<string, string> => {
  const out: Record<string, string> = {};
  entries.forEach((entry) => {
    const key = entry.key.trim();
    if (!key) return;
    out[key] = entry.value;
  });
  return out;
};

/**
 * `'*'` 是「该 provider 已停用」的编码，其唯一所有者是 `form.disabled`：
 * 载入时 `stripDisableAllModelsRule` 把它剥进该 flag，保存时仅凭该 flag 重新追加。
 * 因此这里必须过滤掉用户在文本里手打的 `'*'`——排除模型的编辑面永远不该能开关停用。
 * 导出仅为让 tests/providerExcludedModelsDisableRule.test.ts 钉住这个不变量。
 */
export const buildExcludedModels = (
  textValue: string,
  disabled: boolean,
  brand: ProviderBrand
): string[] | undefined => {
  const list = parseTextList(textValue);
  const filtered = list.filter((v) => v !== '*');
  if (brand === 'openaiCompatibility') {
    return filtered.length ? filtered : undefined;
  }
  if (disabled) {
    return withDisableAllModelsRule(filtered);
  }
  return filtered.length ? filtered : undefined;
};

const buildModelAliases = (
  models: ProviderEntryFormInput['models'] | undefined,
  includeImage = false
): ModelAlias[] =>
  (models ?? [])
    .map((m) => {
      const entry: ModelAlias = {
        sourceIndex: m.sourceIndex ?? null,
        name: m.name.trim(),
        alias: m.alias?.trim() || undefined,
        priority: m.priority,
        ...buildModelOptions(m),
      };
      if (includeImage) {
        entry.image = m.image === true;
      }
      return entry;
    })
    .filter((m) => m.name);

export const buildProviderKeyConfig = (
  brand: 'gemini' | 'interactions' | 'codex' | 'meta' | 'xai' | 'claude' | 'vertex',
  input: ProviderEntryFormInput,
  existing?: ProviderKeyConfig | GeminiKeyConfig | null
): ProviderKeyConfig => {
  const headers = headersFromEntries(input.headers);
  const models = buildModelAliases(input.models);
  const excluded = buildExcludedModels(input.excludedModelsText, input.disabled, brand);
  const apiKeyChanged = input.apiKey.trim().length > 0;
  const next: ProviderKeyConfig = {
    source: existing?.source,
    name: input.name.trim() || undefined,
    apiKey: apiKeyChanged ? input.apiKey.trim() : (existing?.apiKey ?? ''),
    priority: input.priority,
    weight: input.weight,
    prefix: input.prefix.trim() || undefined,
    baseUrl: input.baseUrl.trim() || undefined,
    proxyUrl: input.proxyUrl.trim() || undefined,
    models: models.length ? models : undefined,
    headers: Object.keys(headers).length ? headers : undefined,
    excludedModels: excluded,
    disableCooling: input.disableCooling,
    ...(input.runtimePolicy
      ? buildRuntimePolicy(
          input.runtimePolicy,
          PROVIDER_DESCRIPTORS[brand].supportsRequestScopedErrors
        )
      : {}),
    authIndex: existing?.authIndex,
    ...pickProviderBehavior(input, brand),
    connectionPool: input.connectionPool,
    ...(brand === 'claude' ? { nativeToolSearch: input.nativeToolSearch } : {}),
    ...(brand === 'vertex'
      ? {
          interactions: input.interactions,
          openapi: input.openapi,
          openapiLocation: input.openapiLocation,
        }
      : {}),
  };
  if ((brand === 'codex' || brand === 'xai') && input.websockets !== undefined) {
    next.websockets = input.websockets;
  }
  if (brand === 'claude' && input.cloak) {
    next.cloak = {
      mode: input.cloak.mode.trim() || undefined,
      strictMode: input.cloak.strictMode,
      sensitiveWords: parseTextList(input.cloak.sensitiveWordsText),
      sensitiveWordsReplace: input.cloak.sensitiveWordsReplace,
      sensitivePatternsReplace: input.cloak.sensitivePatternsReplace,
      cacheUserId: input.cloak.cacheUserId === true,
    };
  }
  if (brand === 'claude') {
    next.fingerprintProfile = input.fingerprintProfile?.trim() || undefined;
  }
  return next;
};

/** Patch only edits made in this session onto persisted values, not the form's display defaults. */
function applyDraftDelta<T extends object>(baseline: T, initial: T, edited: T): T {
  const result = { ...baseline };
  for (const key of Object.keys(edited) as (keyof T)[]) {
    if (
      initial[key] !== edited[key] &&
      JSON.stringify(initial[key]) !== JSON.stringify(edited[key])
    ) {
      result[key] = edited[key];
    }
  }
  return result;
}

function buildNativeMemberConfig(
  family: NativeProviderFamily,
  row: NativeConnectionFormOutput['keys'][number],
  existing?: ProviderKeyConfig
) {
  const edited = buildProviderKeyConfig(family, row.input, existing);
  if (!row.initialInput) return edited;
  const initial = buildProviderKeyConfig(family, row.initialInput, existing);
  const config = applyDraftDelta(existing ?? { apiKey: '' }, initial, edited);
  if (initial.cloak && edited.cloak && config.cloak !== existing?.cloak) {
    config.cloak = applyDraftDelta(existing?.cloak ?? {}, initial.cloak, edited.cloak);
  }
  // Runtime policy is one intent: an explicit value equal to the inherited effective
  // value still has to be written. Keep the converted policy and inherit flags together.
  if (
    row.input.runtimePolicy &&
    JSON.stringify(row.input.runtimePolicy) !== JSON.stringify(row.initialInput.runtimePolicy)
  ) {
    Object.assign(
      config,
      buildRuntimePolicy(
        row.input.runtimePolicy,
        PROVIDER_DESCRIPTORS[family].supportsRequestScopedErrors
      )
    );
  }
  return config;
}

/** Preserve opaque keys that are absent from the native editor. */
export function buildNativeConnectionMembers(
  family: NativeProviderFamily,
  section: NativeSection | undefined,
  rows: NativeConnectionFormOutput['keys']
): NativeConnectionMember[] {
  const indexOf = (resource: ProviderResource) =>
    (resource.raw as ProviderKeyConfig).source?.keyIndex;
  const visible = new Set(section?.members.map(indexOf));
  const members: NativeConnectionMember[] = [];
  let cursor = 0;
  const keepHiddenBefore = (end: number) => {
    for (; cursor < end; cursor++) {
      if (!visible.has(cursor)) members.push({ originalKeyIndex: cursor });
    }
  };
  for (const row of rows) {
    const existing = row.resource ? (row.resource.raw as ProviderKeyConfig) : undefined;
    const originalKeyIndex = existing?.source?.keyIndex;
    keepHiddenBefore(originalKeyIndex ?? section?.keyCount ?? 0);
    members.push({
      ...(row.unchanged && originalKeyIndex !== undefined
        ? { originalKeyIndex }
        : { originalKeyIndex, config: buildNativeMemberConfig(family, row, existing) }),
      ...(row.disabled !== undefined ? { disabled: row.disabled } : {}),
    });
  }
  keepHiddenBefore(section?.keyCount ?? 0);
  return members;
}

const buildOpenAIConfig = (
  input: ProviderEntryFormInput,
  existing?: OpenAIProviderConfig | null
): OpenAIProviderConfig => {
  const headers = headersFromEntries(input.headers);
  const models = buildModelAliases(input.models, true);
  const apiKeyEntries =
    input.apiKeyEntries
      ?.map((entry, index) => {
        const fallbackApiKey =
          entry.existingApiKey?.trim() || existing?.apiKeyEntries?.[index]?.apiKey?.trim() || '';
        return {
          apiKey: entry.apiKey.trim() || fallbackApiKey,
          sourceIndex: entry.sourceIndex,
          proxyUrl: entry.proxyUrl.trim() || undefined,
          weight: entry.weight,
          authIndex: entry.authIndex?.trim() || undefined,
        };
      })
      .filter((entry) => entry.apiKey) ?? [];

  return {
    ...(existing ?? {}),
    name: input.name.trim(),
    baseUrl: input.baseUrl.trim(),
    prefix: input.prefix.trim() || undefined,
    apiKeyEntries,
    disabled: input.disabled,
    ...pickProviderBehavior(input, 'openaiCompatibility'),
    disableCooling: input.disableCooling,
    ...(input.runtimePolicy ? buildRuntimePolicy(input.runtimePolicy) : {}),
    headers: Object.keys(headers).length ? headers : undefined,
    models: models.length ? models : undefined,
    priority: input.priority,
  };
};

export const buildProviderGroups = (config: Config): ProviderGroup[] =>
  PROVIDER_BRAND_ORDER.map((brand) => {
    let resources: ProviderResource[] = [];
    switch (brand) {
      case 'gemini':
        resources = (config.geminiApiKeys ?? []).map((c, i) => geminiToResource(c, i));
        break;
      case 'interactions':
        resources = (config.interactionsApiKeys ?? []).map((item, index) =>
          interactionsToResource(item, index)
        );
        break;
      case 'codex':
        resources = (config.codexApiKeys ?? []).map((c, i) => codexToResource(c, i));
        break;
      case 'meta':
        resources = (config.metaApiKeys ?? []).map((item, index) => metaToResource(item, index));
        break;
      case 'xai':
        resources = (config.xaiApiKeys ?? []).map((c, i) => xaiToResource(c, i));
        break;
      case 'claude':
        resources = (config.claudeApiKeys ?? []).map((c, i) => claudeToResource(c, i));
        break;
      case 'vertex':
        resources = (config.vertexApiKeys ?? []).map((c, i) => vertexToResource(c, i));
        break;
      case 'openaiCompatibility':
        resources = (config.openaiCompatibility ?? []).map((c, i) => openaiToResource(c, i));
        break;
    }
    return {
      ...(isNativeFamily(brand)
        ? { nativeSections: buildNativeSections(config, brand, resources) }
        : {}),
      id: brand,
      resources,
    };
  });

/* -------------------------------------------------------------------------- */
/* hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useProviderWorkbench(): UseProviderWorkbenchResult {
  const connectionStatus = useAuthStore((s) => s.connectionStatus);
  const config = useConfigStore((s) => s.config);
  const fetchConfig = useConfigStore((s) => s.fetchConfig);
  const updateConfigValue = useConfigStore((s) => s.updateConfigValue);
  const isCacheValid = useConfigStore((s) => s.isCacheValid);

  const [isPending, setIsPending] = useState<boolean>(() => !isCacheValid());
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mutating, setMutating] = useState<boolean>(false);
  const [fetchedAt, setFetchedAt] = useState<string>(() => new Date().toISOString());

  const hasFetchedRef = useRef(false);

  const connected = connectionStatus === 'connected';

  const refetch = useCallback(async () => {
    setIsFetching(true);
    setErrorMessage(null);
    try {
      // Rows and their group sources must come from the same /config snapshot.
      await fetchConfig(true);
      setFetchedAt(new Date().toISOString());
    } catch (err) {
      setErrorMessage(getErrorMessage(err) || 'Failed to load providers');
    } finally {
      setIsPending(false);
      setIsFetching(false);
    }
  }, [fetchConfig]);

  const refreshSnapshot = useCallback(() => {
    setFetchedAt(new Date().toISOString());
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    if (!connected) return;
    hasFetchedRef.current = true;
    refetch().catch(() => {});
  }, [connected, refetch]);

  /* ------------------- snapshot 计算 ------------------- */

  const snapshot = useMemo<ProviderSnapshot | null>(() => {
    if (!config) return null;
    return {
      fetchedAt,
      groups: buildProviderGroups(config),
    };
  }, [config, fetchedAt]);

  /* ------------------- mutations ------------------- */

  const createProvider = useCallback(
    async (brand: ProviderBrand, input: ProviderEntryFormInput) => {
      setMutating(true);
      try {
        if (brand === 'openaiCompatibility') {
          await providersApi.createOpenAIProvider(buildOpenAIConfig(input));
        }
        await refetch();
      } finally {
        setMutating(false);
      }
    },
    [refetch]
  );

  const updateProvider = useCallback(
    async (resource: ProviderResource, input: ProviderEntryFormInput) => {
      const assertConnection = guardConfigConnection();
      setMutating(true);
      try {
        const brand = resource.brand;
        const selector = resource.selector;
        if (brand === 'openaiCompatibility' && selector.brand === 'openaiCompatibility') {
          await providersApi.updateOpenAIProvider(
            selector.name,
            selector.index,
            buildOpenAIConfig(input, resource.raw as OpenAIProviderConfig)
          );
        }
        assertConnection();
        await refetch();
        assertConnection();
      } finally {
        setMutating(false);
      }
    },
    [refetch]
  );

  const deleteProvider = useCallback(
    async (resource: ProviderResource) => {
      const assertConnection = guardConfigConnection();
      setMutating(true);
      try {
        const sel = resource.selector;
        if (sel.brand === 'openaiCompatibility') {
          await providersApi.deleteOpenAIProvider(
            sel.index,
            (resource.raw as OpenAIProviderConfig).source
          );
          const next = (config?.openaiCompatibility ?? []).filter(
            (item, index) => (item.sourceIndex ?? index) !== sel.index
          );
          updateConfigValue('openai-compatibility', next);
        }
        assertConnection();
        await refetch();
        assertConnection();
      } finally {
        setMutating(false);
      }
    },
    [config, refetch, updateConfigValue]
  );

  const toggleDisabled = useCallback(
    async (resource: ProviderResource, disabled: boolean) => {
      setMutating(true);
      try {
        const brand = resource.brand;
        const selector = resource.selector;
        if (brand === 'openaiCompatibility' && selector.brand === 'openaiCompatibility') {
          await providersApi.updateOpenAIProviderDisabled(
            selector.index,
            disabled,
            (resource.raw as OpenAIProviderConfig).source
          );
        }
        await refetch();
      } finally {
        setMutating(false);
      }
    },
    [refetch]
  );

  const mutateConnection = useCallback(
    async (write: () => Promise<unknown>) => {
      const assertConnection = guardConfigConnection();
      setMutating(true);
      try {
        await write();
        assertConnection();
        await refetch();
        assertConnection();
      } finally {
        setMutating(false);
      }
    },
    [refetch]
  );

  return {
    connected,
    saveNativeConnection: (family, section, draft) =>
      mutateConnection(() =>
        providersApi.saveNativeConnection(
          family,
          section?.source,
          draft.group,
          buildNativeConnectionMembers(family, section, draft.keys),
          draft.allDisabled
        )
      ),
    setConnectionDisabled: (family, section, disabled) =>
      mutateConnection(() => providersApi.setNativeGroupDisabled(family, section.source, disabled)),
    deleteNativeConnection: (family, source) =>
      mutateConnection(() => providersApi.deleteNativeGroup(family, source)),
    isPending,
    isFetching,
    isError: Boolean(errorMessage),
    errorMessage,
    snapshot,
    refetch,
    createProvider,
    updateProvider,
    deleteProvider,
    toggleDisabled,
    mutating,
    refreshSnapshot,
  };
}
