import { TEST_USER_AGENTS } from '@/utils/constants';
import { hasHeader } from '@/utils/headers';

export type TestUserAgentBrand = keyof typeof TEST_USER_AGENTS;

export const ensureTestUserAgent = (
  headers: Record<string, string>,
  brand: TestUserAgentBrand
) => {
  if (!hasHeader(headers, 'user-agent')) {
    headers['User-Agent'] = TEST_USER_AGENTS[brand];
  }
  return headers;
};
