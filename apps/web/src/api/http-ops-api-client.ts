import type {
  AuditLogResponseWithMeta,
  OpsApiClient,
  OverviewMetricsResponse,
  RetryScoringResult,
  RoomsListResponseWithMeta,
  ScoringTasksResponseWithMeta,
  StabilitySummaryResponse,
} from './types';

const NOT_WIRED =
  'HttpOpsApiClient 尚未联调 FastAPI；请使用 MockOpsApiClient 或配置 VITE_OPS_API_BASE_URL。';

/**
 * Future production adapter — maps to:
 * - GET /admin/v1/metrics/*
 * - GET /admin/v1/rooms/*
 * - GET|POST /admin/v1/scoring/*
 * - GET /admin/v1/sentry/*
 */
export class HttpOpsApiClient implements OpsApiClient {
  constructor(private readonly baseUrl: string) {}

  getOverviewMetrics(): Promise<OverviewMetricsResponse> {
    return Promise.reject(new Error(`${NOT_WIRED} GET ${this.baseUrl}/admin/v1/metrics/overview`));
  }

  getStabilitySummary(): Promise<StabilitySummaryResponse> {
    return Promise.reject(new Error(`${NOT_WIRED} GET ${this.baseUrl}/admin/v1/sentry/summary`));
  }

  listRooms(): Promise<RoomsListResponseWithMeta> {
    return Promise.reject(new Error(`${NOT_WIRED} GET ${this.baseUrl}/admin/v1/rooms`));
  }

  listScoringTasks(): Promise<ScoringTasksResponseWithMeta> {
    return Promise.reject(new Error(`${NOT_WIRED} GET ${this.baseUrl}/admin/v1/scoring/tasks`));
  }

  retryScoringTask(taskId: string): Promise<RetryScoringResult> {
    return Promise.reject(
      new Error(`${NOT_WIRED} POST ${this.baseUrl}/admin/v1/scoring/tasks/${taskId}/retry`),
    );
  }

  listAuditLog(): Promise<AuditLogResponseWithMeta> {
    return Promise.reject(new Error(`${NOT_WIRED} GET ${this.baseUrl}/admin/v1/audit/events`));
  }
}
