import { createOpsApiClient } from './create-ops-api-client';

export type { OpsApiClient } from './types';
export { MockOpsApiClient } from './mock-ops-api-client';
export { HttpOpsApiClient } from './http-ops-api-client';
export { createOpsApiClient } from './create-ops-api-client';
export {
  clearOpsRuntimeAuth,
  setOpsRuntimeAuth,
  type OpsRuntimeAuth,
} from './ops-runtime-auth';

export const opsApiClient = createOpsApiClient();
