import { getDevOpsAdminHeaders } from './ops-dev-admin-env';
import {
  getOpsRuntimeAdminMfa,
  getOpsRuntimeAdminRole,
  getOpsRuntimeAuthorization,
} from './ops-runtime-auth';
import { HttpOpsApiClient } from './http-ops-api-client';
import { MockOpsApiClient } from './mock-ops-api-client';
import type { OpsApiClient } from './types';

function pickRuntimeThenDev(
  runtime: () => string | undefined,
  dev: () => string | undefined,
): () => string | undefined {
  return () => runtime() ?? dev();
}

export function createOpsApiClient(): OpsApiClient {
  const mode = import.meta.env.VITE_OPS_API_MODE;
  const baseUrl = import.meta.env.VITE_OPS_API_BASE_URL ?? '';

  if (mode === 'http' && baseUrl) {
    return new HttpOpsApiClient({
      baseUrl,
      credentials: 'include',
      getAuthorizationHeader: pickRuntimeThenDev(
        getOpsRuntimeAuthorization,
        () => getDevOpsAdminHeaders().authorization,
      ),
      getAdminMfaHeader: pickRuntimeThenDev(
        getOpsRuntimeAdminMfa,
        () => getDevOpsAdminHeaders().adminMfa,
      ),
      getAdminRoleHeader: pickRuntimeThenDev(
        getOpsRuntimeAdminRole,
        () => getDevOpsAdminHeaders().adminRole,
      ),
    });
  }

  return new MockOpsApiClient();
}
