import type { ProviderBrand } from './types';

type FormProviderBrand = Exclude<ProviderBrand, 'ampcode'>;

const DISABLE_COOLING_BRANDS = new Set<FormProviderBrand>([
  'gemini',
  'codex',
  'claude',
  'openaiCompatibility',
]);

const SINGLE_KEY_TEST_MODEL_BRANDS = new Set<FormProviderBrand>([
  'gemini',
  'codex',
  'claude',
]);

export const supportsDisableCoolingControl = (brand: ProviderBrand): boolean =>
  DISABLE_COOLING_BRANDS.has(brand as FormProviderBrand);

export const supportsSingleKeyTestModel = (brand: ProviderBrand): boolean =>
  SINGLE_KEY_TEST_MODEL_BRANDS.has(brand as FormProviderBrand);

export const supportsTestModelSelection = (brand: ProviderBrand): boolean =>
  brand === 'openaiCompatibility' || supportsSingleKeyTestModel(brand);

export const supportsOpenAIModelOptions = (brand: ProviderBrand): boolean =>
  brand === 'openaiCompatibility';
