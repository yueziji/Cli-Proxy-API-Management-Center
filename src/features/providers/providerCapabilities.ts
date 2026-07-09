import { PROVIDER_DESCRIPTORS } from './descriptors';
import type { ProviderBrand } from './types';

/**
 * 品牌能力查询,统一从 PROVIDER_DESCRIPTORS 派生,避免第二份能力清单
 * 与 descriptor 漂移。新增 brand 时只需维护 descriptors.ts。
 */

export const supportsDisableCoolingControl = (brand: ProviderBrand): boolean =>
  PROVIDER_DESCRIPTORS[brand].supportsDisableCooling;

/** 单密钥 brand(gemini/codex/claude)的测试模型仅用于连通性测试,不持久化。 */
export const supportsSingleKeyTestModel = (brand: ProviderBrand): boolean =>
  PROVIDER_DESCRIPTORS[brand].supportsTestModel &&
  !PROVIDER_DESCRIPTORS[brand].supportsApiKeyEntries;

export const supportsTestModelSelection = (brand: ProviderBrand): boolean =>
  PROVIDER_DESCRIPTORS[brand].supportsTestModel;

export const supportsOpenAIModelOptions = (brand: ProviderBrand): boolean =>
  PROVIDER_DESCRIPTORS[brand].supportsApiKeyEntries;
