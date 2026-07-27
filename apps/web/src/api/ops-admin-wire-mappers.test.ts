import { describe, expect, it } from 'vitest';

import {
  mapAdminAuditWire,
  mapAdminOverviewWire,
  mapAdminRoomsWire,
  mapAdminScoringRetryWire,
  mapAdminScoringWire,
  mapAdminStabilityWire,
} from './ops-admin-wire-mappers';

describe('ops-admin-wire-mappers', () => {
  it('maps overview snake_case wire to UI metrics with zeroed retention/conversion', () => {
    const mapped = mapAdminOverviewWire({
      data_source: 'backend',
      total_stored_events: 9999,
      unique_user_ids: 42,
      counts_by_event_name: { room_join: 10 },
      generated_at: '2026-07-27T02:00:00+08:00',
    });

    expect(mapped).toMatchObject({
      dataSource: 'backend',
      generatedAt: '2026-07-27T02:00:00+08:00',
      dau: 42,
      dauDeltaPercent: 0,
      d1RetentionRate: 0,
      d7RetentionRate: 0,
      roomConversionRate: 0,
      scoringCompletionRate: 0,
    });
    expect(mapped.disclaimer).toContain('基础事件聚合');
  });

  it('maps stability issues to errorTrend and topIssues with placeholder users', () => {
    const mapped = mapAdminStabilityWire({
      data_source: 'backend',
      note: 'Sentry proxy pending',
      generated_at: '2026-07-27T03:00:00+08:00',
      issues: [
        { issue_id: 'ERR-1', title: 'Timeout', count: 3, date: '2026-07-26' },
        { issue_id: 'ERR-2', title: 'Worker lag', count: 1 },
      ],
    });

    expect(mapped.dataSource).toBe('backend');
    expect(mapped.generatedAt).toBe('2026-07-27T03:00:00+08:00');
    expect(mapped.disclaimer).toBe('Sentry proxy pending');
    expect(mapped.affectedUsersPlaceholder).toBe(0);
    expect(mapped.errorTrend).toEqual([{ date: '2026-07-26', count: 3 }]);
    expect(mapped.topIssues).toEqual([
      { id: 'ERR-1', title: 'Timeout', count: 3 },
      { id: 'ERR-2', title: 'Worker lag', count: 1 },
    ]);
  });

  it('maps rooms items with lobby/live/ended lifecycle and default recording idle', () => {
    const mapped = mapAdminRoomsWire({
      data_source: 'backend',
      items: [
        {
          room_id: 'r-1',
          title: 'Lobby Room',
          status: 'lobby',
          version: 1,
          host_player_id: 'host-secret',
          member_count: 2,
        },
        {
          room_id: 'r-2',
          title: 'Live Room',
          status: 'live',
          member_count: 5,
        },
        {
          room_id: 'r-3',
          title: 'Done',
          status: 'ended',
          member_count: 0,
        },
      ],
    });

    expect(mapped.rooms).toEqual([
      {
        id: 'r-1',
        name: 'Lobby Room',
        status: 'waiting',
        memberCount: 2,
        recordingStatus: 'idle',
      },
      {
        id: 'r-2',
        name: 'Live Room',
        status: 'active',
        memberCount: 5,
        recordingStatus: 'idle',
      },
      {
        id: 'r-3',
        name: 'Done',
        status: 'ended',
        memberCount: 0,
        recordingStatus: 'idle',
      },
    ]);
  });

  it('maps scoring items with masked player label and status/retry flags', () => {
    const mapped = mapAdminScoringWire({
      data_source: 'backend',
      items: [
        {
          score_job_id: 'job-1',
          room_id: 'r-1',
          player_id: 'player-abcdef12',
          status: 'pending',
          attempt_count: 0,
          scores: null,
        },
        {
          score_job_id: 'job-2',
          player_id: 'p9',
          status: 'failed',
          attempt_count: 2,
        },
        {
          score_job_id: 'job-3',
          player_id: 'p10',
          status: 'retryable',
          attempt_count: 1,
        },
      ],
    });

    expect(mapped.tasks[0]).toMatchObject({
      id: 'job-1',
      playerLabel: 'Player · ef12',
      status: 'queued',
      retryAllowed: false,
    });
    expect(mapped.tasks[1]).toMatchObject({
      id: 'job-2',
      playerLabel: 'Player · p9',
      status: 'failed',
      retryAllowed: true,
    });
    expect(mapped.tasks[2]).toMatchObject({
      status: 'retryable',
      retryAllowed: true,
    });
    expect(mapped.tasks.every((t) => !t.playerLabel.includes('@'))).toBe(true);
  });

  it('maps audit items to entries with role-only actor', () => {
    const mapped = mapAdminAuditWire({
      data_source: 'backend',
      items: [
        {
          actor_role: 'operator',
          action: 'retry_scoring',
          target: 'job-1',
          result: 'success',
          occurred_at: '2026-07-27T04:00:00+08:00',
        },
      ],
    });

    expect(mapped.entries[0]).toMatchObject({
      actor: 'operator',
      action: 'retry_scoring',
      target: 'job-1',
      result: 'success',
      occurredAt: '2026-07-27T04:00:00+08:00',
    });
    expect(mapped.entries[0]?.actor).not.toMatch(/@/);
  });

  it('maps retry wire to UI RetryScoringResult without leaking internal fields', () => {
    const mapped = mapAdminScoringRetryWire(
      {
        score_job_id: 'job-99',
        status: 'accepted',
        internal_token: 'secret',
        admin_session_id: 'sess-1',
        message: 'queued for worker',
      },
      'job-fallback',
    );

    expect(mapped).toEqual({
      taskId: 'job-99',
      status: 'mock_accepted',
      message: 'queued for worker',
    });
    expect(mapped).not.toHaveProperty('internal_token');
  });
});
