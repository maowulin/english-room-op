import type {
  AuditLogResponseWithMeta,
  OverviewMetricsResponse,
  RoomsListResponseWithMeta,
  ScoringTasksResponseWithMeta,
  StabilitySummaryResponse,
} from '../api/types';

const demoMeta = {
  dataSource: 'demo' as const,
  generatedAt: '2026-07-27T00:00:00+08:00',
  disclaimer:
    '以下均为演示数据，用于验证运营台布局与 adapter 边界，不代表真实线上指标。',
};

export const mockOverviewMetrics: OverviewMetricsResponse = {
  ...demoMeta,
  dau: 1284,
  dauDeltaPercent: 4.2,
  d1RetentionRate: 0.38,
  d7RetentionRate: 0.21,
  roomConversionRate: 0.62,
  scoringCompletionRate: 0.91,
};

export const mockStabilitySummary: StabilitySummaryResponse = {
  ...demoMeta,
  affectedUsersPlaceholder: 37,
  errorTrend: [
    { date: '2026-07-21', count: 12 },
    { date: '2026-07-22', count: 9 },
    { date: '2026-07-23', count: 15 },
    { date: '2026-07-24', count: 8 },
    { date: '2026-07-25', count: 11 },
    { date: '2026-07-26', count: 6 },
    { date: '2026-07-27', count: 10 },
  ],
  topIssues: [
    { id: 'DEMO-101', title: 'WebRTC reconnect timeout (demo)', count: 14 },
    { id: 'DEMO-102', title: 'Scoring worker backlog (demo)', count: 9 },
  ],
};

export const mockRooms: RoomsListResponseWithMeta = {
  ...demoMeta,
  rooms: [
    {
      id: 'room-demo-1',
      name: 'Morning Practice A',
      status: 'active',
      memberCount: 4,
      recordingStatus: 'recording',
    },
    {
      id: 'room-demo-2',
      name: 'Evening Debate B',
      status: 'waiting',
      memberCount: 2,
      recordingStatus: 'idle',
    },
    {
      id: 'room-demo-3',
      name: 'Closed Session C',
      status: 'ended',
      memberCount: 0,
      recordingStatus: 'processing',
    },
  ],
};

export const mockScoringTasks: ScoringTasksResponseWithMeta = {
  ...demoMeta,
  tasks: [
    {
      id: 'score-demo-1',
      playerLabel: 'Player · demo-01',
      status: 'failed',
      failureReason: 'ASR timeout (demo)',
      retryAllowed: true,
    },
    {
      id: 'score-demo-2',
      playerLabel: 'Player · demo-02',
      status: 'running',
      failureReason: null,
      retryAllowed: false,
    },
    {
      id: 'score-demo-3',
      playerLabel: 'Player · demo-03',
      status: 'succeeded',
      failureReason: null,
      retryAllowed: false,
    },
  ],
};

export const mockAuditLog: AuditLogResponseWithMeta = {
  ...demoMeta,
  entries: [
    {
      id: 'audit-demo-1',
      actor: 'admin.demo@example.com',
      action: 'metrics.overview.read',
      target: '/admin/v1/metrics/overview',
      result: 'success',
      occurredAt: '2026-07-27T08:12:00+08:00',
    },
    {
      id: 'audit-demo-2',
      actor: 'operator.demo@example.com',
      action: 'scoring.retry.requested',
      target: 'score-demo-1',
      result: 'success',
      occurredAt: '2026-07-27T08:05:00+08:00',
    },
  ],
};
