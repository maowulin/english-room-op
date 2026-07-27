import { describe, expect, it } from 'vitest';

import {
  mapAdminAuditWire,
  mapAdminOverviewWire,
  mapAdminRoomsWire,
  mapAdminScoringRetryWire,
  mapAdminScoringWire,
  mapAdminStabilityWire,
} from './ops-admin-wire-mappers';

const meta = {
  data_source: 'backend',
  generated_at: '2026-07-27T08:00:00+08:00',
  disclaimer: '真实后端数据',
};

describe('current admin wire contract', () => {
  it('maps the overview envelope and preserves backend date metrics', () => {
    expect(
      mapAdminOverviewWire({
        meta,
        data: {
          date_from: '2026-07-21',
          date_to: '2026-07-27',
          dau: 12486,
          session_count: 8421,
          room_start_count: 5812,
          room_completion_rate: 0.762,
          score_report_view_rate: 0.398,
          d7_retention: 0.256,
        },
      }),
    ).toMatchObject({
      dataSource: 'backend',
      dateFrom: '2026-07-21',
      dateTo: '2026-07-27',
      dau: 12486,
      sessionCount: 8421,
      roomStartCount: 5812,
      roomCompletionRate: 0.762,
      scoreReportViewRate: 0.398,
      d7RetentionRate: 0.256,
    });
  });

  it('preserves first_party as the wire data source', () => {
    expect(
      mapAdminOverviewWire({
        meta: { ...meta, data_source: 'first_party' },
        data: {},
      }).dataSource,
    ).toBe('first_party');
  });

  it('does not derive room conversion from room completion', () => {
    expect(
      mapAdminOverviewWire({
        meta,
        data: { room_completion_rate: 0.762 },
      }).roomConversionRate,
    ).toBeUndefined();
  });

  it('maps stability failure rates and trend from the envelope', () => {
    expect(
      mapAdminStabilityWire({
        meta,
        data: {
          app_opened: { count: 10000, failure_rate: 0.0018 },
          rtc_connection_changed: { count: 1000, failure_rate: 0.0042 },
          recording_status_changed: { count: 500, failure_rate: 0.006 },
          trend: [{ day: '2026-07-27', count: 12 }],
        },
      }),
    ).toMatchObject({
      appOpenedCount: 10000,
      appOpenedFailureRate: 0.0018,
      rtcFailureRate: 0.0042,
      recordingFailureRate: 0.006,
      errorTrend: [{ date: '2026-07-27', count: 12 }],
    });
  });

  it('maps empty rooms, scoring, and audit envelopes without inventing rows', () => {
    expect(mapAdminRoomsWire({ meta, data: { items: [], summary: { total: 0 } } }).rooms).toEqual([]);
    expect(mapAdminScoringWire({ meta, data: { items: [], summary: { total: 0 } } }).tasks).toEqual([]);
    expect(mapAdminAuditWire({ meta, data: { items: [], summary: { total: 0 } } }).entries).toEqual([]);
  });

  it('maps an audit event without result to unknown', () => {
    expect(
      mapAdminAuditWire({
        meta,
        data: {
          items: [{ id: 'event-1', action: 'retry', request_id: 'req-1', details: {} }],
          summary: { total: 1 },
        },
      }).entries[0].result,
    ).toBe('unknown');
  });

  it('maps the retry response with pending/not_started semantics', () => {
    expect(
      mapAdminScoringRetryWire(
        {
          meta,
          data: {
            score_job_id: 'job-1',
            status: 'pending',
            execution: 'not_started',
            request_id: 'req-1',
          },
        },
        'fallback',
      ),
    ).toMatchObject({
      taskId: 'job-1',
      status: 'pending',
      execution: 'not_started',
      requestId: 'req-1',
    });
  });
});
