import type {
  AuditLogResponseWithMeta,
  OpsDataSource,
  OverviewMetricsResponse,
  RetryScoringResult,
  RoomLifecycleStatus,
  RoomsListResponseWithMeta,
  ScoringTaskStatus,
  ScoringTasksResponseWithMeta,
  StabilitySummaryResponse,
} from './types';

const OVERVIEW_BACKEND_DISCLAIMER =
  '当前后端仅提供基础事件聚合（DAU 等）；留存与转化指标尚未接入，展示为 0。';

const STABILITY_BACKEND_DISCLAIMER =
  '稳定性摘要来自后端 issues 占位数据；受影响用户数尚未接入 Sentry 代理。';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function mapDataSource(raw: unknown): OpsDataSource {
  const value = asString(raw);
  if (value === 'backend' || value === 'placeholder') {
    return value;
  }
  return 'backend';
}

function maskPlayerLabel(playerId: unknown): string {
  const id = asString(playerId) ?? 'unknown';
  const suffix = id.length <= 4 ? id : id.slice(-4);
  return `Player · ${suffix}`;
}

function mapRoomStatus(raw: unknown): RoomLifecycleStatus {
  const status = asString(raw)?.toLowerCase();
  switch (status) {
    case 'lobby':
      return 'waiting';
    case 'live':
      return 'active';
    case 'closing':
      return 'closing';
    case 'ended':
      return 'ended';
    case 'waiting':
    case 'active':
      return status;
    default:
      return 'waiting';
  }
}

function mapScoringStatus(raw: unknown): ScoringTaskStatus {
  const status = asString(raw)?.toLowerCase();
  switch (status) {
    case 'queued':
    case 'pending':
      return 'queued';
    case 'running':
    case 'in_progress':
    case 'processing':
      return 'running';
    case 'succeeded':
    case 'completed':
    case 'success':
      return 'succeeded';
    case 'failed':
    case 'error':
      return 'failed';
    case 'retryable':
      return 'retryable';
    default:
      return 'queued';
  }
}

function mapAuditResult(raw: unknown): 'success' | 'failure' {
  const value = asString(raw)?.toLowerCase();
  if (value === 'failure' || value === 'failed' || value === 'error') {
    return 'failure';
  }
  return 'success';
}

type StabilityIssueWire = {
  issue_id?: string;
  id?: string;
  title?: string;
  count?: number;
  date?: string;
};

function parseStabilityIssues(raw: unknown): StabilityIssueWire[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((item) => item && typeof item === 'object') as StabilityIssueWire[];
}

export function mapAdminOverviewWire(body: unknown): OverviewMetricsResponse {
  const record = asRecord(body) ?? {};
  return {
    dataSource: mapDataSource(record.data_source),
    generatedAt: asString(record.generated_at) ?? new Date().toISOString(),
    disclaimer: OVERVIEW_BACKEND_DISCLAIMER,
    dau: asNumber(record.unique_user_ids),
    dauDeltaPercent: 0,
    d1RetentionRate: 0,
    d7RetentionRate: 0,
    roomConversionRate: 0,
    scoringCompletionRate: 0,
  };
}

export function mapAdminStabilityWire(body: unknown): StabilitySummaryResponse {
  const record = asRecord(body) ?? {};
  const issues = parseStabilityIssues(record.issues);
  const errorTrend = issues
    .filter((issue) => asString(issue.date))
    .map((issue) => ({
      date: asString(issue.date)!,
      count: asNumber(issue.count),
    }));
  const topIssues = issues.map((issue, index) => ({
    id: asString(issue.issue_id) ?? asString(issue.id) ?? `issue-${index + 1}`,
    title: asString(issue.title) ?? 'Unknown issue',
    count: asNumber(issue.count),
  }));

  return {
    dataSource: mapDataSource(record.data_source),
    generatedAt: asString(record.generated_at) ?? new Date().toISOString(),
    disclaimer: asString(record.note) ?? STABILITY_BACKEND_DISCLAIMER,
    errorTrend,
    affectedUsersPlaceholder: 0,
    topIssues,
  };
}

export function mapAdminRoomsWire(body: unknown): RoomsListResponseWithMeta {
  const record = asRecord(body) ?? {};
  const items = Array.isArray(record.items) ? record.items : [];
  const generatedAt = asString(record.generated_at) ?? new Date().toISOString();

  const rooms = items.map((item) => {
    const row = asRecord(item) ?? {};
    return {
      id: asString(row.room_id) ?? '',
      name: asString(row.title) ?? 'Untitled room',
      status: mapRoomStatus(row.status),
      memberCount: asNumber(row.member_count),
      recordingStatus: 'idle' as const,
    };
  });

  return {
    dataSource: mapDataSource(record.data_source),
    generatedAt,
    disclaimer: '房间列表来自 FastAPI /admin/v1/rooms；录制状态尚未在 admin 响应中暴露。',
    rooms,
  };
}

export function mapAdminScoringWire(body: unknown): ScoringTasksResponseWithMeta {
  const record = asRecord(body) ?? {};
  const items = Array.isArray(record.items) ? record.items : [];
  const generatedAt = asString(record.generated_at) ?? new Date().toISOString();

  const tasks = items.map((item) => {
    const row = asRecord(item) ?? {};
    const status = mapScoringStatus(row.status);
    const attemptCount = asNumber(row.attempt_count);
    const retryAllowed =
      status === 'retryable' || (status === 'failed' && attemptCount > 0);
    return {
      id: asString(row.score_job_id) ?? '',
      playerLabel: maskPlayerLabel(row.player_id),
      status,
      failureReason: status === 'failed' || status === 'retryable' ? 'Scoring failed' : null,
      retryAllowed,
    };
  });

  return {
    dataSource: mapDataSource(record.data_source),
    generatedAt,
    disclaimer: '评分任务来自 FastAPI /admin/v1/scoring；玩家仅显示脱敏标签。',
    tasks,
  };
}

export function mapAdminAuditWire(body: unknown): AuditLogResponseWithMeta {
  const record = asRecord(body) ?? {};
  const items = Array.isArray(record.items) ? record.items : [];
  const generatedAt = asString(record.generated_at) ?? new Date().toISOString();

  const entries = items.map((item, index) => {
    const row = asRecord(item) ?? {};
    const occurredAt = asString(row.occurred_at) ?? generatedAt;
    const action = asString(row.action) ?? '';
    const target = asString(row.target) ?? '';
    return {
      id: `${occurredAt}-${index}-${action}`,
      actor: asString(row.actor_role) ?? 'unknown',
      action,
      target,
      result: mapAuditResult(row.result),
      occurredAt,
    };
  });

  return {
    dataSource: mapDataSource(record.data_source),
    generatedAt,
    disclaimer: '审计日志仅展示 actor 角色，不包含管理员身份标识。',
    entries,
  };
}

export function mapAdminScoringRetryWire(
  body: unknown,
  requestedTaskId: string,
): RetryScoringResult {
  const record = asRecord(body);
  const taskId =
    asString(record?.score_job_id) ??
    asString(record?.task_id) ??
    asString(record?.taskId) ??
    requestedTaskId;
  const message =
    asString(record?.message) ??
    asString(record?.detail) ??
    'Retry request accepted by backend.';

  return {
    taskId,
    status: 'mock_accepted',
    message,
  };
}
