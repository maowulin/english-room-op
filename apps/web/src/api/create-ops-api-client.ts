import { assertOpsApiBaseUrlAllowedFromEnv } from './ops-api-base-url-policy';
import {
  getOpsRuntimeAdminMfa,
  getOpsRuntimeAdminRole,
  getOpsRuntimeAuthorization,
} from './ops-runtime-auth';
import { HttpOpsApiClient } from './http-ops-api-client';
import { MockOpsApiClient } from './mock-ops-api-client';
import type {
  OpsApiClient,
  RetryScoringResult,
} from './types';

export class OpsApiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpsApiConfigurationError';
  }
}

class UnavailableOpsApiClient implements OpsApiClient {
  constructor(private readonly message: string) {}

  private unavailable<T>(): Promise<T> {
    return Promise.reject(new OpsApiConfigurationError(this.message));
  }

  login() {
    return this.unavailable<Awaited<ReturnType<OpsApiClient['login']>>>();
  }

  getCurrentAdmin() {
    return this.unavailable<Awaited<ReturnType<OpsApiClient['getCurrentAdmin']>>>();
  }

  logout() {
    return this.unavailable<void>();
  }

  getHealth() {
    return this.unavailable<Awaited<ReturnType<OpsApiClient['getHealth']>>>();
  }

  getOverviewMetrics() {
    return this.unavailable<Awaited<ReturnType<OpsApiClient['getOverviewMetrics']>>>();
  }

  getStabilitySummary() {
    return this.unavailable<Awaited<ReturnType<OpsApiClient['getStabilitySummary']>>>();
  }

  listRooms() {
    return this.unavailable<Awaited<ReturnType<OpsApiClient['listRooms']>>>();
  }

  listScoringTasks() {
    return this.unavailable<Awaited<ReturnType<OpsApiClient['listScoringTasks']>>>();
  }

  retryScoringTask(): Promise<RetryScoringResult> {
    return this.unavailable<RetryScoringResult>();
  }

  listAuditLog() {
    return this.unavailable<Awaited<ReturnType<OpsApiClient['listAuditLog']>>>();
  }
}

export function createOpsApiClient(): OpsApiClient {
  const mode = import.meta.env.VITE_OPS_API_MODE?.trim().toLowerCase();
  const baseUrl = import.meta.env.VITE_OPS_API_BASE_URL?.trim() ?? '';

  if (mode === 'mock') {
    return new MockOpsApiClient();
  }

  if (!baseUrl) {
    return new UnavailableOpsApiClient(
      '运营后端未配置：请设置 VITE_OPS_API_BASE_URL；如需演示数据，请显式设置 VITE_OPS_API_MODE=mock。',
    );
  }

  assertOpsApiBaseUrlAllowedFromEnv(baseUrl);

  return new HttpOpsApiClient({
    baseUrl,
    credentials: 'include',
    getAuthorizationHeader: getOpsRuntimeAuthorization,
    getAdminMfaHeader: getOpsRuntimeAdminMfa,
    getAdminRoleHeader: getOpsRuntimeAdminRole,
  });
}
