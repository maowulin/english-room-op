export const DEMO_DATA_LABEL = '演示数据' as const;

export type OpsDataSource = 'demo' | 'backend' | 'placeholder';

export interface OpsResponseMeta {
  dataSource: OpsDataSource;
  generatedAt: string;
  disclaimer: string;
}

export interface OpsDateRange {
  dateFrom?: string;
  dateTo?: string;
}

export interface OpsHealthResponse {
  status: 'ok' | 'unknown';
  generatedAt: string;
}

/** @deprecated use OpsResponseMeta */
export type DemoMeta = OpsResponseMeta;

export interface OverviewMetrics {
  dau: number;
  sessionCount: number;
  roomStartCount: number;
  roomCompletionRate: number;
  scoreReportViewRate: number;
  dateFrom: string;
  dateTo: string;
  dauDeltaPercent: number;
  d1RetentionRate: number;
  d7RetentionRate: number;
  roomConversionRate: number;
  scoringCompletionRate: number;
  activeTrend: Array<{ day: string; count: number }>;
  retentionHeatmap: Array<{ label: string; d1: number; d7: number; d30: number }>;
  funnel: Array<{ label: string; count: number; rate: number }>;
}

export interface OverviewMetricsResponse extends OverviewMetrics, DemoMeta {}

export interface StabilitySummary {
  errorTrend: Array<{ date: string; count: number }>;
  affectedUsersPlaceholder: number;
  topIssues: Array<{ id: string; title: string; count: number }>;
  appOpenedCount: number;
  appOpenedFailureRate: number;
  rtcConnectionCount: number;
  rtcFailureRate: number;
  recordingStatusCount: number;
  recordingFailureRate: number;
  versionHealth: Array<{ label: string; value: number; color?: string }>;
  deviceBreakdown: Array<{ label: string; value: number }>;
  networkBreakdown: Array<{ label: string; value: number }>;
}

export interface StabilitySummaryResponse extends StabilitySummary, DemoMeta {}

export type RoomLifecycleStatus = 'waiting' | 'active' | 'closing' | 'ended';

export interface RoomSnapshot {
  id: string;
  name: string;
  status: RoomLifecycleStatus;
  memberCount: number;
  recordingStatus: 'idle' | 'recording' | 'processing' | 'failed';
  ownerLabel?: string;
  createdAt?: string;
  durationSeconds?: number;
  trtcStatus?: string;
  scoringStatus?: string;
  members?: Array<{
    id: string;
    label: string;
    role?: string;
    speaking?: boolean;
    muted?: boolean;
    network?: string;
  }>;
  lifecycle?: Array<{ label: string; occurredAt?: string; state: string }>;
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
  createdAt?: string;
  roomId?: string;
  audioAssetId?: string;
  execution?: 'not_started' | 'running' | 'completed' | 'failed';
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
  requestId?: string;
  scoreJobId?: string;
  details?: Record<string, unknown>;
  risk?: 'low' | 'medium' | 'high';
}

export interface AuditLogResponse {
  entries: AuditLogEntry[];
}

export interface AuditLogResponseWithMeta extends AuditLogResponse, DemoMeta {}

export interface RetryScoringResult {
  taskId: string;
  status: 'mock_accepted' | 'pending';
  execution?: 'not_started';
  requestId?: string;
  message: string;
}

/** Future HTTP adapter boundary: `/admin/v1/metrics/*`, `/rooms/*`, `/scoring/*`, `/sentry/*`. */
export interface OpsApiClient {
  getHealth(): Promise<OpsHealthResponse>;
  getOverviewMetrics(range?: OpsDateRange): Promise<OverviewMetricsResponse>;
  getStabilitySummary(range?: OpsDateRange): Promise<StabilitySummaryResponse>;
  listRooms(): Promise<RoomsListResponseWithMeta>;
  listScoringTasks(): Promise<ScoringTasksResponseWithMeta>;
  retryScoringTask(taskId: string): Promise<RetryScoringResult>;
  listAuditLog(): Promise<AuditLogResponseWithMeta>;
}
