export const DEMO_DATA_LABEL = '演示数据' as const;

export interface DemoMeta {
  dataSource: 'demo';
  generatedAt: string;
  disclaimer: string;
}

export interface OverviewMetrics {
  dau: number;
  dauDeltaPercent: number;
  d1RetentionRate: number;
  d7RetentionRate: number;
  roomConversionRate: number;
  scoringCompletionRate: number;
}

export interface OverviewMetricsResponse extends OverviewMetrics, DemoMeta {}

export interface StabilitySummary {
  errorTrend: Array<{ date: string; count: number }>;
  affectedUsersPlaceholder: number;
  topIssues: Array<{ id: string; title: string; count: number }>;
}

export interface StabilitySummaryResponse extends StabilitySummary, DemoMeta {}

export type RoomLifecycleStatus = 'waiting' | 'active' | 'closing' | 'ended';

export interface RoomSnapshot {
  id: string;
  name: string;
  status: RoomLifecycleStatus;
  memberCount: number;
  recordingStatus: 'idle' | 'recording' | 'processing' | 'failed';
}

export interface RoomsListResponse {
  rooms: RoomSnapshot[];
}

export interface RoomsListResponseWithMeta extends RoomsListResponse, DemoMeta {}

export type ScoringTaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'retryable';

export interface ScoringTask {
  id: string;
  playerLabel: string;
  status: ScoringTaskStatus;
  failureReason: string | null;
  retryAllowed: boolean;
}

export interface ScoringTasksResponse {
  tasks: ScoringTask[];
}

export interface ScoringTasksResponseWithMeta extends ScoringTasksResponse, DemoMeta {}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  result: 'success' | 'failure';
  occurredAt: string;
}

export interface AuditLogResponse {
  entries: AuditLogEntry[];
}

export interface AuditLogResponseWithMeta extends AuditLogResponse, DemoMeta {}

export interface RetryScoringResult {
  taskId: string;
  status: 'mock_accepted';
  message: string;
}

/** Future HTTP adapter boundary: `/admin/v1/metrics/*`, `/rooms/*`, `/scoring/*`, `/sentry/*`. */
export interface OpsApiClient {
  getOverviewMetrics(): Promise<OverviewMetricsResponse>;
  getStabilitySummary(): Promise<StabilitySummaryResponse>;
  listRooms(): Promise<RoomsListResponseWithMeta>;
  listScoringTasks(): Promise<ScoringTasksResponseWithMeta>;
  retryScoringTask(taskId: string): Promise<RetryScoringResult>;
  listAuditLog(): Promise<AuditLogResponseWithMeta>;
}
