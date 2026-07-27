import {
  mapAdminAuditWire,
  mapAdminOverviewWire,
  mapAdminRoomsWire,
  mapAdminScoringRetryWire,
  mapAdminScoringWire,
  mapAdminStabilityWire,
} from './ops-admin-wire-mappers';
import type { OpsApiClient, RetryScoringResult } from './types';
import {
  opsFetchJson,
  type OpsHttpExtraHeadersProvider,
  type OpsHttpFetcher,
  type OpsHttpCredentials,
  type OpsHttpHeaderProvider,
  type OpsHttpRequestConfig,
} from './ops-http-request';

export type HttpOpsApiClientOptions = {
  baseUrl: string;
  fetcher?: OpsHttpFetcher;
  credentials?: OpsHttpCredentials;
  timeoutMs?: number;
  getAuthorizationHeader?: OpsHttpHeaderProvider;
  getAdminMfaHeader?: OpsHttpHeaderProvider;
  getAdminRoleHeader?: OpsHttpHeaderProvider;
  getExtraHeaders?: OpsHttpExtraHeadersProvider;
};

const ADMIN = {
  metricsOverview: '/admin/v1/metrics/overview',
  metricsStability: '/admin/v1/metrics/stability',
  rooms: '/admin/v1/rooms',
  scoring: '/admin/v1/scoring',
  auditEvents: '/admin/v1/audit/events',
  scoringRetry: (taskId: string) => `/admin/v1/scoring/${encodeURIComponent(taskId)}/retry`,
} as const;

/**
 * Production HTTP adapter — maps FastAPI `/admin/v1/*` snake_case wire JSON to UI camelCase types.
 * Wire mappers live in `ops-admin-wire-mappers.ts`; HTTP 模式仍需 admin 头与 Backend RBAC。
 */
export class HttpOpsApiClient implements OpsApiClient {
  private readonly request: OpsHttpRequestConfig;

  constructor(baseUrlOrOptions: string | HttpOpsApiClientOptions) {
    const options =
      typeof baseUrlOrOptions === 'string' ? { baseUrl: baseUrlOrOptions } : baseUrlOrOptions;

    this.request = {
      baseUrl: options.baseUrl,
      fetcher: options.fetcher ?? fetch,
      credentials: options.credentials,
      timeoutMs: options.timeoutMs,
      getAuthorizationHeader: options.getAuthorizationHeader,
      getAdminMfaHeader: options.getAdminMfaHeader,
      getAdminRoleHeader: options.getAdminRoleHeader,
      getExtraHeaders: options.getExtraHeaders,
    };
  }

  async getOverviewMetrics() {
    const wire = await opsFetchJson<unknown>(this.request, 'GET', ADMIN.metricsOverview);
    return mapAdminOverviewWire(wire);
  }

  async getStabilitySummary() {
    const wire = await opsFetchJson<unknown>(this.request, 'GET', ADMIN.metricsStability);
    return mapAdminStabilityWire(wire);
  }

  async listRooms() {
    const wire = await opsFetchJson<unknown>(this.request, 'GET', ADMIN.rooms);
    return mapAdminRoomsWire(wire);
  }

  async listScoringTasks() {
    const wire = await opsFetchJson<unknown>(this.request, 'GET', ADMIN.scoring);
    return mapAdminScoringWire(wire);
  }

  async retryScoringTask(taskId: string): Promise<RetryScoringResult> {
    const wire = await opsFetchJson<unknown>(this.request, 'POST', ADMIN.scoringRetry(taskId));
    return mapAdminScoringRetryWire(wire, taskId);
  }

  async listAuditLog() {
    const wire = await opsFetchJson<unknown>(this.request, 'GET', ADMIN.auditEvents);
    return mapAdminAuditWire(wire);
  }
}

export { OpsHttpError, OpsHttpTimeoutError } from './ops-http-request';
