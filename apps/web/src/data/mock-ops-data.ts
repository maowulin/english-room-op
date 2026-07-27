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
  sessionCount: 2846,
  roomStartCount: 1248,
  roomCompletionRate: 0.762,
  scoreReportViewRate: 0.398,
  dateFrom: '2026-07-21',
  dateTo: '2026-07-27',
  dauDeltaPercent: 4.2,
  d1RetentionRate: 0.38,
  d7RetentionRate: 0.21,
  roomConversionRate: 0.62,
  scoringCompletionRate: 0.91,
  activeTrend: [
    { day: '07/21', count: 920 }, { day: '07/22', count: 980 }, { day: '07/23', count: 1100 },
    { day: '07/24', count: 1020 }, { day: '07/25', count: 1260 }, { day: '07/26', count: 1180 }, { day: '07/27', count: 1284 },
  ],
  retentionHeatmap: [
    { label: '07/21 - 07/27', d1: 0.428, d7: 0.256, d30: 0.124 },
    { label: '07/14 - 07/20', d1: 0.411, d7: 0.241, d30: 0.12 },
    { label: '07/07 - 07/13', d1: 0.395, d7: 0.228, d30: 0.112 },
  ],
  funnel: [
    { label: '打开 App', count: 62348, rate: 1 },
    { label: '加入房间', count: 42735, rate: 0.685 },
    { label: '完成房间', count: 27487, rate: 0.441 },
    { label: '查看评分', count: 24849, rate: 0.398 },
  ],
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
  appOpenedCount: 62348,
  appOpenedFailureRate: 0.0018,
  rtcConnectionCount: 42735,
  rtcFailureRate: 0.0042,
  recordingStatusCount: 12480,
  recordingFailureRate: 0.006,
  versionHealth: [
    { label: 'v1.3.0', value: 0.82, color: '#16785a' },
    { label: 'v1.2.2', value: 0.14, color: '#62ab8d' },
    { label: '其他', value: 0.04, color: '#b8d8ca' },
  ],
  deviceBreakdown: [{ label: 'iOS', value: 0.687 }, { label: 'Android', value: 0.313 }],
  networkBreakdown: [{ label: 'Wi-Fi', value: 0.724 }, { label: '4G', value: 0.213 }, { label: '5G', value: 0.063 }],
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
      ownerLabel: '林舟',
      createdAt: '2026-07-27T14:18:00+08:00',
      durationSeconds: 1122,
      trtcStatus: '正常',
      scoringStatus: '未开始',
      members: [
        { id: 'player-demo-1', label: 'Player · mo-01', role: '房主', speaking: true, network: '良好' },
        { id: 'player-demo-2', label: 'Player · mo-02', muted: true, network: '良好' },
      ],
      lifecycle: [
        { label: '创建', state: 'created', occurredAt: '14:18' },
        { label: '进行中', state: 'active', occurredAt: '14:24' },
      ],
    },
    {
      id: 'room-demo-2',
      name: 'Evening Debate B',
      status: 'waiting',
      memberCount: 2,
      recordingStatus: 'idle',
      ownerLabel: 'Mia',
      createdAt: '2026-07-27T14:05:00+08:00',
      durationSeconds: 0,
      trtcStatus: '未入房',
      scoringStatus: '未开始',
    },
    {
      id: 'room-demo-3',
      name: 'Closed Session C',
      status: 'ended',
      memberCount: 0,
      recordingStatus: 'processing',
      ownerLabel: 'Alex',
      createdAt: '2026-07-27T13:40:00+08:00',
      durationSeconds: 840,
      trtcStatus: '已结束',
      scoringStatus: '评分中',
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
      createdAt: '2026-07-27T14:18:52+08:00',
      roomId: 'room-demo-1',
      audioAssetId: 'asset_demo_141852',
    },
    {
      id: 'score-demo-2',
      playerLabel: 'Player · demo-02',
      status: 'running',
      failureReason: null,
      retryAllowed: false,
      createdAt: '2026-07-27T14:17:21+08:00',
      roomId: 'room-demo-1',
    },
    {
      id: 'score-demo-3',
      playerLabel: 'Player · demo-03',
      status: 'succeeded',
      failureReason: null,
      retryAllowed: false,
      createdAt: '2026-07-27T14:15:32+08:00',
      roomId: 'room-demo-2',
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
