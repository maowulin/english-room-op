import type {
  AuditLogResponseWithMeta,
  OpsApiClient,
  OverviewMetricsResponse,
  RetryScoringResult,
  RoomsListResponseWithMeta,
  ScoringTasksResponseWithMeta,
  StabilitySummaryResponse,
} from './types';
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
 * Production HTTP adapter — maps to FastAPI `/admin/v1/*` (Backend must implement routes + RBAC).
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

  getOverviewMetrics(): Promise<OverviewMetricsResponse> {
    return opsFetchJson<OverviewMetricsResponse>(this.request, 'GET', ADMIN.metricsOverview);
  }

  getStabilitySummary(): Promise<StabilitySummaryResponse> {
    return opsFetchJson<StabilitySummaryResponse>(this.request, 'GET', ADMIN.metricsStability);
  }

  listRooms(): Promise<RoomsListResponseWithMeta> {
    return opsFetchJson<RoomsListResponseWithMeta>(this.request, 'GET', ADMIN.rooms);
  }

  listScoringTasks(): Promise<ScoringTasksResponseWithMeta> {
    return opsFetchJson<ScoringTasksResponseWithMeta>(this.request, 'GET', ADMIN.scoring);
  }

  retryScoringTask(taskId: string): Promise<RetryScoringResult> {
    return opsFetchJson<RetryScoringResult>(this.request, 'POST', ADMIN.scoringRetry(taskId));
  }

  listAuditLog(): Promise<AuditLogResponseWithMeta> {
    return opsFetchJson<AuditLogResponseWithMeta>(this.request, 'GET', ADMIN.auditEvents);
  }
}

export { OpsHttpError, OpsHttpTimeoutError } from './ops-http-request';
