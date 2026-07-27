import type {
  AuditLogEntry,
  AuditLogResponseWithMeta,
  OpsDataSource,
  OverviewMetricsResponse,
  RetryScoringResult,
  RoomLifecycleStatus,
  RoomSnapshot,
  RoomsListResponseWithMeta,
  ScoringTask,
  ScoringTaskStatus,
  ScoringTasksResponseWithMeta,
  StabilitySummaryResponse,
} from './types';

const DEFAULT_DISCLAIMER = '数据来自 FastAPI /admin/v1。';
const OVERVIEW_BACKEND_DISCLAIMER =
  '当前后端仅提供基础事件聚合（DAU 等）；留存与转化指标尚未接入，展示为 0。';
const STABILITY_BACKEND_DISCLAIMER =
  '稳定性摘要来自后端事件聚合；Issue 与设备明细尚未接入 Sentry 代理。';

type WireEnvelope = { meta: Record<string, unknown>; data: Record<string, unknown> };

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

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function unwrap(body: unknown): WireEnvelope {
  const root = asRecord(body) ?? {};
  const envelopeData = asRecord(root.data);
  const envelopeMeta = asRecord(root.meta);
  return envelopeData && envelopeMeta
    ? { meta: envelopeMeta, data: envelopeData }
    : { meta: root, data: root };
}

function mapDataSource(raw: unknown): OpsDataSource {
  const value = asString(raw);
  if (value === 'backend' || value === 'first_party' || value === 'placeholder' || value === 'demo') {
    return value;
  }
  return 'backend';
}

function mapMeta(meta: Record<string, unknown>, fallback = DEFAULT_DISCLAIMER) {
  return {
    dataSource: mapDataSource(meta.data_source ?? meta.dataSource),
    generatedAt: asString(meta.generated_at ?? meta.generatedAt) ?? new Date().toISOString(),
    disclaimer: asString(meta.disclaimer ?? meta.note) ?? fallback,
  } as const;
}

function maskPlayerLabel(playerId: unknown): string {
  const id = asString(playerId) ?? 'unknown';
  const suffix = id.length <= 4 ? id : id.slice(-4);
  return `Player · ${suffix}`;
}

function mapRoomStatus(raw: unknown): RoomLifecycleStatus {
  switch (asString(raw)?.toLowerCase()) {
    case 'lobby':
    case 'waiting':
      return 'waiting';
    case 'live':
    case 'active':
      return 'active';
    case 'closing':
      return 'closing';
    case 'ended':
      return 'ended';
    default:
      return 'waiting';
  }
}

function mapRecordingStatus(raw: unknown): RoomSnapshotRecordingStatus {
  switch (asString(raw)?.toLowerCase()) {
    case 'recording':
    case 'processing':
    case 'failed':
      return raw as RoomSnapshotRecordingStatus;
    default:
      return 'idle';
  }
}

type RoomSnapshotRecordingStatus = 'idle' | 'recording' | 'processing' | 'failed';

function mapScoringStatus(raw: unknown): ScoringTaskStatus {
  switch (asString(raw)?.toLowerCase()) {
    case 'queued':
    case 'pending':
    case 'waiting':
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

function mapAuditResult(raw: unknown): 'success' | 'failure' | 'unknown' {
  const value = asString(raw)?.toLowerCase();
  if (value === 'failure' || value === 'failed' || value === 'error') return 'failure';
  if (value === 'success' || value === 'succeeded' || value === 'ok') return 'success';
  return 'unknown';
}

function mapOverviewTrend(raw: unknown): Array<{ day: string; count: number }> {
  return asArray(raw).flatMap((item) => {
    const row = asRecord(item);
    const day = asString(row?.day ?? row?.date);
    return day ? [{ day, count: asNumber(row?.count) }] : [];
  });
}

export function mapAdminOverviewWire(body: unknown): OverviewMetricsResponse {
  const { meta, data } = unwrap(body);
  const isEnvelope = asRecord(body)?.data !== undefined;
  const baseMeta = mapMeta(meta, OVERVIEW_BACKEND_DISCLAIMER);
  const activeTrend = mapOverviewTrend(data.active_trend ?? data.trend);
  const heatmap = asArray(data.retention_heatmap).flatMap((item) => {
    const row = asRecord(item);
    if (!row) return [];
    return [
      {
        label: asString(row.label ?? row.week) ?? '',
        d1: asNumber(row.d1),
        d7: asNumber(row.d7),
        d30: asNumber(row.d30),
      },
    ];
  });
  const funnel = asArray(data.funnel).flatMap((item) => {
    const row = asRecord(item);
    if (!row) return [];
    return [
      {
        label: asString(row.label ?? row.name) ?? '',
        count: asNumber(row.count),
        rate: asNumber(row.rate),
      },
    ];
  });

  return {
    ...baseMeta,
    dateFrom: asString(data.date_from) ?? '',
    dateTo: asString(data.date_to) ?? '',
    dau: asNumber(data.dau ?? data.unique_user_ids),
    sessionCount: asNumber(data.session_count),
    roomStartCount: asNumber(data.room_start_count),
    roomCompletionRate: optionalNumber(data.room_completion_rate),
    scoreReportViewRate: optionalNumber(data.score_report_view_rate),
    dauDeltaPercent: optionalNumber(data.dau_delta_percent),
    d1RetentionRate: optionalNumber(data.d1_retention),
    d7RetentionRate: optionalNumber(data.d7_retention),
    roomConversionRate: optionalNumber(data.room_conversion_rate),
    scoringCompletionRate: optionalNumber(data.scoring_completion_rate),
    activeTrend,
    retentionHeatmap: heatmap,
    funnel,
    ...(isEnvelope ? {} : { disclaimer: baseMeta.disclaimer }),
  };
}

export function mapAdminStabilityWire(body: unknown): StabilitySummaryResponse {
  const { meta, data } = unwrap(body);
  const trend = mapOverviewTrend(data.trend ?? data.error_trend);
  const issues = asArray(data.issues).flatMap((item, index) => {
    const row = asRecord(item);
    return row
      ? [
          {
            id: asString(row.issue_id ?? row.id) ?? `issue-${index + 1}`,
            title: asString(row.title) ?? 'Unknown issue',
            count: asNumber(row.count),
          },
        ]
      : [];
  });
  const appOpened = asRecord(data.app_opened) ?? {};
  const rtc = asRecord(data.rtc_connection_changed) ?? {};
  const recording = asRecord(data.recording_status_changed) ?? {};
  const versionHealth = asArray(data.version_health).flatMap((item) => {
    const row = asRecord(item);
    return row
      ? [{ label: asString(row.label ?? row.version) ?? '', value: asNumber(row.value ?? row.rate), color: asString(row.color) }]
      : [];
  });
  const breakdown = (raw: unknown) =>
    asArray(raw).flatMap((item) => {
      const row = asRecord(item);
      return row ? [{ label: asString(row.label ?? row.name) ?? '', value: asNumber(row.value ?? row.rate) }] : [];
    });

  return {
    ...mapMeta(meta, STABILITY_BACKEND_DISCLAIMER),
    errorTrend: trend.map((point) => ({ date: point.day, count: point.count })),
    affectedUsersPlaceholder: optionalNumber(data.affected_users),
    topIssues: issues,
    appOpenedCount: optionalNumber(appOpened.count),
    appOpenedFailureRate: optionalNumber(appOpened.failure_rate),
    rtcConnectionCount: optionalNumber(rtc.count),
    rtcFailureRate: optionalNumber(rtc.failure_rate),
    recordingStatusCount: optionalNumber(recording.count),
    recordingFailureRate: optionalNumber(recording.failure_rate),
    versionHealth,
    deviceBreakdown: breakdown(data.device_breakdown),
    networkBreakdown: breakdown(data.network_breakdown),
  };
}

export function mapAdminRoomsWire(body: unknown): RoomsListResponseWithMeta {
  const { meta, data } = unwrap(body);
  const rooms = asArray(data.items).flatMap((item) => {
    const row = asRecord(item);
    if (!row) return [];
    const members = asArray(row.members).flatMap((member) => {
      const memberRow = asRecord(member);
      return memberRow
        ? [
            {
              id: asString(memberRow.player_id ?? memberRow.id) ?? '',
              label: maskPlayerLabel(memberRow.player_id ?? memberRow.id),
              role: asString(memberRow.role),
              speaking: memberRow.speaking === true,
              muted: memberRow.muted === true,
              network: asString(memberRow.network),
            },
          ]
        : [];
    });
    const lifecycle = asArray(row.lifecycle).flatMap((event) => {
      const eventRow = asRecord(event);
      return eventRow
        ? [{ label: asString(eventRow.label ?? eventRow.state) ?? '', occurredAt: asString(eventRow.occurred_at), state: asString(eventRow.state) ?? '' }]
        : [];
    });
    const room: RoomSnapshot = {
        id: asString(row.room_id ?? row.id) ?? '',
        name: asString(row.title ?? row.name) ?? 'Untitled room',
        status: mapRoomStatus(row.status ?? row.state),
        memberCount: asNumber(row.member_count ?? row.memberCount),
        recordingStatus: mapRecordingStatus(row.recording_status),
    };
    const ownerLabel = asString(row.owner_label);
    const createdAt = asString(row.created_at);
    const trtcStatus = asString(row.trtc_status);
    const scoringStatus = asString(row.scoring_status);
    if (ownerLabel) room.ownerLabel = ownerLabel;
    if (createdAt) room.createdAt = createdAt;
    if (typeof row.duration_seconds === 'number') room.durationSeconds = row.duration_seconds;
    if (trtcStatus) room.trtcStatus = trtcStatus;
    if (scoringStatus) room.scoringStatus = scoringStatus;
    if (Array.isArray(row.members)) room.members = members;
    if (Array.isArray(row.lifecycle)) room.lifecycle = lifecycle;
    return [room];
  });
  return {
    ...mapMeta(meta),
    rooms,
  };
}

export function mapAdminScoringWire(body: unknown): ScoringTasksResponseWithMeta {
  const { meta, data } = unwrap(body);
  const tasks = asArray(data.items).flatMap((item) => {
    const row = asRecord(item);
    if (!row) return [];
    const status = mapScoringStatus(row.state ?? row.status);
    const attemptCount = asNumber(row.attempt_count);
    return [
      {
        id: asString(row.score_job_id ?? row.id) ?? '',
        playerLabel: maskPlayerLabel(row.player_id),
        status,
        failureReason: asString(row.failure_reason) ?? (status === 'failed' || status === 'retryable' ? '评分暂未成功' : null),
        retryAllowed: status === 'retryable' || status === 'failed' || attemptCount > 0,
        createdAt: asString(row.created_at),
        roomId: asString(row.room_id),
        audioAssetId: asString(row.audio_asset_id),
        execution: asString(row.execution) as ScoringTask['execution'],
      },
    ];
  });
  return {
    ...mapMeta(meta),
    tasks,
  };
}

export function mapAdminAuditWire(body: unknown): AuditLogResponseWithMeta {
  const { meta, data } = unwrap(body);
  const generatedAt = asString(meta.generated_at ?? meta.generatedAt) ?? new Date().toISOString();
  const entries = asArray(data.items).flatMap((item, index) => {
    const row = asRecord(item);
    if (!row) return [];
    const occurredAt = asString(row.occurred_at) ?? generatedAt;
    const action = asString(row.action) ?? '';
    const details = asRecord(row.details) ?? undefined;
    const result = mapAuditResult(row.result ?? details?.result);
    const riskValue = asString(row.risk ?? details?.risk)?.toLowerCase();
    const risk: AuditLogEntry['risk'] = riskValue === 'high' || riskValue === 'medium' ? riskValue : 'low';
    return [
      {
        id: asString(row.id) ?? `${occurredAt}-${index}-${action}`,
        actor: asString(row.actor_role ?? row.actor) ?? 'unknown',
        action,
        target: asString(row.target ?? row.score_job_id) ?? '',
        result,
        occurredAt,
        requestId: asString(row.request_id),
        scoreJobId: asString(row.score_job_id),
        details,
        risk,
      },
    ];
  });
  return {
    ...mapMeta(meta),
    entries,
  };
}

export function mapAdminScoringRetryWire(body: unknown, requestedTaskId: string): RetryScoringResult {
  const root = asRecord(body);
  const envelopeData = asRecord(root?.data);
  if (envelopeData) {
    const taskId = asString(envelopeData.score_job_id) ?? requestedTaskId;
    const requestId = asString(envelopeData.request_id) ?? '';
    return {
      taskId,
      status: 'pending',
      execution: 'not_started',
      requestId,
      message: '本地占位：重试请求已提交，评分尚未启动。',
    };
  }

  const taskId = asString(root?.score_job_id ?? root?.task_id ?? root?.taskId) ?? requestedTaskId;
  const message = asString(root?.message) ?? '演示模式：重试请求已接受。';
  return { taskId, status: 'mock_accepted', message };
}
