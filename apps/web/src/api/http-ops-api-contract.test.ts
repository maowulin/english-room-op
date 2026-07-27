import { describe, expect, it, vi } from 'vitest';

import { HttpOpsApiClient } from './http-ops-api-client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('HttpOpsApiClient current contract', () => {
  it('adds date_from/date_to query parameters and admin token', async () => {
    const fetcher = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const headers = init?.headers as Headers;
      expect(headers.get('X-Ops-Admin-Token')).toBe('local-token');
      return jsonResponse({
        meta: { data_source: 'backend', generated_at: 'now', disclaimer: 'ok' },
        data: {
          date_from: '2026-07-21',
          date_to: '2026-07-27',
          dau: 1,
          session_count: 2,
          room_start_count: 3,
          room_completion_rate: 0.5,
          score_report_view_rate: 0.25,
          d7_retention: 0.1,
        },
      });
    });

    const client = new HttpOpsApiClient({
      baseUrl: 'https://ops.example',
      fetcher,
      getExtraHeaders: () => ({ 'X-Ops-Admin-Token': 'local-token' }),
    });

    await client.getOverviewMetrics({ dateFrom: '2026-07-21', dateTo: '2026-07-27' });
    expect(String(fetcher.mock.calls[0]?.[0])).toBe(
      'https://ops.example/admin/v1/metrics/overview?date_from=2026-07-21&date_to=2026-07-27',
    );
  });

  it('adds a UUID v4 Idempotency-Key to retry and does not render raw backend errors', async () => {
    const fetcher = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const headers = init?.headers as Headers;
      expect(headers.get('Idempotency-Key')).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      return jsonResponse({
        meta: { data_source: 'backend', generated_at: 'now', disclaimer: 'ok' },
        data: {
          score_job_id: 'job-1',
          status: 'pending',
          execution: 'not_started',
          request_id: 'req-1',
        },
      });
    });

    const client = new HttpOpsApiClient({ baseUrl: 'https://ops.example', fetcher });
    const result = await client.retryScoringTask('job-1');
    expect(result).toMatchObject({ status: 'pending', execution: 'not_started' });
  });
});
