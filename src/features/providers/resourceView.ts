/**
 * Pure view logic for the provider workbench: filtering, sorting and usage lookups.
 * Kept free of React so the list behaviour can be tested without a DOM.
 */

import {
  getOpenAIProviderRecentStatusData,
  getOpenAIProviderRecentWindowStats,
  getOpenAIProviderTotalStats,
  getProviderRecentStatusData,
  getProviderRecentWindowStats,
  getProviderTotalStats,
  getProviderUsageKey,
  type ProviderRecentUsageMap,
} from '@/components/providers/utils';
import type { OpenAIProviderConfig } from '@/types';
import type { StatusBarData } from '@/utils/recentRequests';
import type { ProviderGroup, ProviderResource, ProviderSortBy, SortDir } from './types';

/** Count the connections shown as cards, not the credentials inside each connection. */
export const connectionCounts = (group: ProviderGroup) =>
  group.nativeSections
    ? {
        total: group.nativeSections.length,
        active: group.nativeSections.filter((section) =>
          section.members.some((member) => !member.disabled)
        ).length,
      }
    : {
        total: group.resources.length,
        active: group.resources.filter((resource) => !resource.disabled).length,
      };

export const matchesResourceFilter = (resource: ProviderResource, query: string): boolean => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [
    resource.identifier,
    resource.name,
    resource.authIndex,
    resource.apiKeyPreview,
    resource.apiKey,
    resource.baseUrl,
    resource.proxyUrl,
    resource.prefix,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalized));
};

export const getResourceSortName = (resource: ProviderResource): string =>
  (resource.name ?? resource.identifier ?? resource.apiKeyPreview ?? '').toLowerCase();

export const getResourceRecentSuccess = (
  resource: ProviderResource,
  usage: ProviderRecentUsageMap
): number => {
  if (resource.brand === 'openaiCompatibility') {
    return getOpenAIProviderRecentWindowStats(resource.raw as OpenAIProviderConfig, usage).success;
  }
  return getProviderRecentWindowStats(
    usage,
    getProviderUsageKey(resource.brand),
    resource.apiKey ?? undefined,
    resource.baseUrl ?? undefined
  ).success;
};

/** Deduplicated, sorted model names configured across a group's resources. */
export const collectGroupModels = (group: ProviderGroup | null): string[] => {
  if (!group) return [];
  const seen = new Set<string>();
  group.resources.forEach((resource) => resource.models.forEach((name) => seen.add(name)));
  return Array.from(seen).sort();
};

/** An unavailable search field must not narrow the model picker. */
export const getModelPickerView = (models: readonly string[], query: string) => {
  const showSearch = models.length > 8;
  const term = showSearch ? query.trim().toLowerCase() : '';
  const visibleModels = term ? models.filter((name) => name.toLowerCase().includes(term)) : models;
  return { showSearch, visibleModels };
};

export interface ResourceListQuery {
  filter: string;
  selectedModels: ReadonlySet<string>;
  sortBy: ProviderSortBy;
  sortDir: SortDir;
}

/** Applies the text filter, the model filter and the stable sort used by the card grid. */
export const selectVisibleResources = (
  resources: ProviderResource[],
  query: ResourceListQuery,
  usage: ProviderRecentUsageMap
): ProviderResource[] => {
  const filtered = resources.filter(
    (resource) =>
      matchesResourceFilter(resource, query.filter) &&
      (query.selectedModels.size === 0 ||
        resource.models.some((name) => query.selectedModels.has(name)))
  );
  return [...filtered].sort((a, b) => {
    const sortDiff =
      query.sortBy === 'name'
        ? getResourceSortName(a).localeCompare(getResourceSortName(b))
        : query.sortBy === 'priority'
          ? (a.priority ?? 0) - (b.priority ?? 0)
          : getResourceRecentSuccess(a, usage) - getResourceRecentSuccess(b, usage);
    const diff = sortDiff || a.originalIndex - b.originalIndex;
    return query.sortDir === 'asc' ? diff : -diff;
  });
};

export interface ResourceUsage {
  success: number;
  failure: number;
  statusData: StatusBarData;
}

/** Recent request health for a resource. */
export const resolveResourceUsage = (
  resource: ProviderResource,
  usage: ProviderRecentUsageMap
): ResourceUsage | null => {
  if (resource.brand === 'openaiCompatibility') {
    const config = resource.raw as OpenAIProviderConfig;
    return {
      ...getOpenAIProviderTotalStats(config, usage),
      statusData: getOpenAIProviderRecentStatusData(config, usage),
    };
  }
  const key = getProviderUsageKey(resource.brand);
  const apiKey = resource.apiKey ?? undefined;
  const baseUrl = resource.baseUrl ?? undefined;
  return {
    ...getProviderTotalStats(usage, key, apiKey, baseUrl),
    statusData: getProviderRecentStatusData(usage, key, apiKey, baseUrl),
  };
};

/** Human label used in confirmations and titles. */
export const getResourceDisplayName = (resource: ProviderResource): string =>
  resource.name ?? resource.apiKeyPreview ?? resource.identifier ?? '';
