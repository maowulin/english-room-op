import { HttpOpsApiClient } from './http-ops-api-client';
import { MockOpsApiClient } from './mock-ops-api-client';
import type { OpsApiClient } from './types';

export type { OpsApiClient } from './types';
export { MockOpsApiClient } from './mock-ops-api-client';
export { HttpOpsApiClient } from './http-ops-api-client';

export function createOpsApiClient(): OpsApiClient {
  const mode = import.meta.env.VITE_OPS_API_MODE;
  const baseUrl = import.meta.env.VITE_OPS_API_BASE_URL ?? '';

  if (mode === 'http' && baseUrl) {
    return new HttpOpsApiClient(baseUrl);
  }

  return new MockOpsApiClient();
}

export const opsApiClient = createOpsApiClient();
