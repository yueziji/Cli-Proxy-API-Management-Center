import {
  getOpenAIProviderRecentStatusData,
  getOpenAIProviderTotalStats,
  getProviderRecentStatusData,
  getProviderTotalStats,
  type ProviderRecentUsageMap,
} from '@/components/providers/utils';
import type { OpenAIProviderConfig } from '@/types';
import type { StatusBarData } from '@/utils/recentRequests';
import type { ProviderResource } from './types';

export const resolveStatusBarData = (
  resource: ProviderResource,
  usageByProvider: ProviderRecentUsageMap
): StatusBarData => {
  if (resource.brand === 'openaiCompatibility') {
    return getOpenAIProviderRecentStatusData(
      resource.raw as OpenAIProviderConfig,
      usageByProvider
    );
  }
  return getProviderRecentStatusData(
    usageByProvider,
    resource.brand,
    resource.apiKey ?? undefined,
    resource.baseUrl ?? undefined
  );
};

export const resolveTotalStats = (
  resource: ProviderResource,
  usageByProvider: ProviderRecentUsageMap
): { success: number; failure: number } => {
  if (resource.brand === 'openaiCompatibility') {
    return getOpenAIProviderTotalStats(
      resource.raw as OpenAIProviderConfig,
      usageByProvider
    );
  }
  return getProviderTotalStats(
    usageByProvider,
    resource.brand,
    resource.apiKey ?? undefined,
    resource.baseUrl ?? undefined
  );
};
