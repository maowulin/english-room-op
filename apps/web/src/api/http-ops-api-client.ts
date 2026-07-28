import {
  mapAdminAuditWire,
  mapAdminOverviewWire,
  mapAdminRoomsWire,
  mapAdminScoringRetryWire,
  mapAdminScoringWire,
  mapAdminStabilityWire,
} from './ops-admin-wire-mappers';
import type {
  AdminLoginResult,
  AdminProfile,
  OpsApiClient,
  OpsDateRange,
  OpsHealthResponse,
  RetryScoringResult,
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
  assertBaseUrlAllowed?: (baseUrl: string) => void;
};

const ADMIN = {
  health: '/health',
  login: '/admin/v1/auth/login',
  currentAdmin: '/admin/v1/auth/me',
  logout: '/admin/v1/auth/logout',
  metricsOverview: '/admin/v1/metrics/overview',
  metricsStability: '/admin/v1/metrics/stability',
  rooms: '/admin/v1/rooms',
  scoring: '/admin/v1/scoring',
  auditEvents: '/admin/v1/audit/events',
  scoringRetry: (taskId: string) => `/admin/v1/scoring/${encodeURIComponent(taskId)}/retry`,
} as const;

function withDateRange(path: string, range?: OpsDateRange): string {
  if (!range?.dateFrom && !range?.dateTo) {
    return path;
  }

  const params = new URLSearchParams();
  if (range.dateFrom) params.set('date_from', range.dateFrom);
  if (range.dateTo) params.set('date_to', range.dateTo);
  return `${path}?${params.toString()}`;
}

function unwrapAdminData(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {};
  const root = value as Record<string, unknown>;
  return root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : root;
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function optionalNumberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function generateUuidV4(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

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
      fetcher: options.fetcher ?? globalThis.fetch.bind(globalThis),
      credentials: options.credentials,
      timeoutMs: options.timeoutMs,
      getAuthorizationHeader: options.getAuthorizationHeader,
      getAdminMfaHeader: options.getAdminMfaHeader,
      getAdminRoleHeader: options.getAdminRoleHeader,
      getExtraHeaders: options.getExtraHeaders,
      assertBaseUrlAllowed: options.assertBaseUrlAllowed,
    };
  }

  async login(username: string, password: string): Promise<AdminLoginResult> {
    const wire = await opsFetchJson<unknown>(this.request, 'POST', ADMIN.login, {
      username,
      password,
    });
    const data = unwrapAdminData(wire);
    return {
      accessToken: stringValue(data.access_token),
      tokenType: 'Bearer',
      expiresAt: numberValue(data.expires_at),
      username: stringValue(data.username),
      role: stringValue(data.role),
    };
  }

  async getCurrentAdmin(): Promise<AdminProfile> {
    const wire = await opsFetchJson<unknown>(this.request, 'GET', ADMIN.currentAdmin);
    const data = unwrapAdminData(wire);
    return {
      username: stringValue(data.username),
      role: stringValue(data.role),
      authType: stringValue(data.auth_type),
      expiresAt: optionalNumberValue(data.expires_at),
    };
  }

  async logout(): Promise<void> {
    await opsFetchJson<unknown>(this.request, 'POST', ADMIN.logout);
  }

  async getHealth(): Promise<OpsHealthResponse> {
    const wire = await opsFetchJson<unknown>(this.request, 'GET', ADMIN.health);
    const record = wire && typeof wire === 'object' ? (wire as Record<string, unknown>) : {};
    return {
      status: record.status === 'ok' ? 'ok' : 'unknown',
      generatedAt: typeof record.generated_at === 'string' ? record.generated_at : new Date().toISOString(),
    };
  }

  async getOverviewMetrics(range?: OpsDateRange) {
    const wire = await opsFetchJson<unknown>(this.request, 'GET', withDateRange(ADMIN.metricsOverview, range));
    return mapAdminOverviewWire(wire);
  }

  async getStabilitySummary(range?: OpsDateRange) {
    const wire = await opsFetchJson<unknown>(this.request, 'GET', withDateRange(ADMIN.metricsStability, range));
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
    const wire = await opsFetchJson<unknown>(
      this.request,
      'POST',
      ADMIN.scoringRetry(taskId),
      undefined,
      { 'Idempotency-Key': generateUuidV4() },
    );
    return mapAdminScoringRetryWire(wire, taskId);
  }

  async listAuditLog() {
    const wire = await opsFetchJson<unknown>(this.request, 'GET', ADMIN.auditEvents);
    return mapAdminAuditWire(wire);
  }
}

export { OpsHttpError, OpsHttpTimeoutError } from './ops-http-request';
