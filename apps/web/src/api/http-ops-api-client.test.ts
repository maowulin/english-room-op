import { afterEach, describe, expect, it, vi } from 'vitest';

import { HttpOpsApiClient } from './http-ops-api-client';
import { OpsHttpError, OpsHttpTimeoutError } from './ops-http-request';

function jsonResponse(status: number, body: unknown, statusText = 'OK'): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { 'Content-Type': 'application/json' },
  });
}

const overviewWire = {
  data_source: 'backend',
  total_stored_events: 100,
  unique_user_ids: 100,
  counts_by_event_name: {},
  generated_at: '2026-07-27T01:00:00+08:00',
};

describe('HttpOpsApiClient', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('GET /admin/v1/metrics/overview maps snake_case wire to UI metrics', async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      expect(String(url)).toBe('https://ops.example/admin/v1/metrics/overview');
      return jsonResponse(200, overviewWire);
    });

    const client = new HttpOpsApiClient({
      baseUrl: 'https://ops.example',
      fetcher,
    });

    const metrics = await client.getOverviewMetrics();
    expect(metrics.dau).toBe(100);
    expect(metrics.dataSource).toBe('backend');
    expect(metrics.d1RetentionRate).toBeUndefined();
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('GET /admin/v1/metrics/stability maps issues wire to stability summary', async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      expect(String(url)).toBe('https://ops.example/admin/v1/metrics/stability');
      return jsonResponse(200, {
        data_source: 'backend',
        note: 'placeholder stability',
        generated_at: '2026-07-27T01:00:00+08:00',
        issues: [{ issue_id: 'I-1', title: 'Demo', count: 2, date: '2026-07-27' }],
      });
    });

    const client = new HttpOpsApiClient({ baseUrl: 'https://ops.example', fetcher });
    const summary = await client.getStabilitySummary();
    expect(summary.topIssues[0]?.id).toBe('I-1');
    expect(summary.affectedUsersPlaceholder).toBeUndefined();
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('GET /admin/v1/rooms, /scoring, /audit/events hit expected paths and map wire', async () => {
    const seen: string[] = [];
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      seen.push(String(url));
      if (String(url).endsWith('/rooms')) {
        return jsonResponse(200, {
          data_source: 'backend',
          items: [
            {
              room_id: 'room-1',
              title: 'Test',
              status: 'live',
              member_count: 3,
            },
          ],
        });
      }
      if (String(url).endsWith('/scoring')) {
        return jsonResponse(200, {
          data_source: 'backend',
          items: [
            {
              score_job_id: 'task-1',
              room_id: 'room-1',
              player_id: 'player-xyz',
              status: 'running',
              attempt_count: 1,
            },
          ],
        });
      }
      if (String(url).endsWith('/audit/events')) {
        return jsonResponse(200, {
          data_source: 'backend',
          items: [
            {
              actor_role: 'viewer',
              action: 'list_rooms',
              target: 'rooms',
              result: 'success',
              occurred_at: '2026-07-27T05:00:00+08:00',
            },
          ],
        });
      }
      return jsonResponse(404, { message: 'not found' });
    });

    const client = new HttpOpsApiClient({ baseUrl: 'https://ops.example/', fetcher });
    const rooms = await client.listRooms();
    const tasks = await client.listScoringTasks();
    const audit = await client.listAuditLog();

    expect(seen).toEqual([
      'https://ops.example/admin/v1/rooms',
      'https://ops.example/admin/v1/scoring',
      'https://ops.example/admin/v1/audit/events',
    ]);
    expect(rooms.rooms[0]?.id).toBe('room-1');
    expect(rooms.rooms[0]?.status).toBe('active');
    expect(tasks.tasks[0]?.id).toBe('task-1');
    expect(tasks.tasks[0]?.playerLabel).toMatch(/^Player ·/);
    expect(audit.entries[0]?.actor).toBe('viewer');
  });

  it('POST /admin/v1/scoring/{id}/retry maps backend wire to RetryScoringResult', async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe('https://ops.example/admin/v1/scoring/task-1/retry');
      expect(init?.method).toBe('POST');
      expect(init?.body).toBeUndefined();
      return jsonResponse(200, {
        score_job_id: 'task-1',
        status: 'accepted',
        message: 'accepted',
        admin_token: 'must-not-leak',
      });
    });

    const client = new HttpOpsApiClient({ baseUrl: 'https://ops.example', fetcher });
    const result = await client.retryScoringTask('task-1');
    expect(result).toEqual({
      taskId: 'task-1',
      status: 'mock_accepted',
      message: 'accepted',
    });
  });

  it('throws OpsHttpError on non-2xx with JSON message', async () => {
    const fetcher = vi.fn(async () => jsonResponse(403, { message: 'forbidden' }, 'Forbidden'));

    const client = new HttpOpsApiClient({ baseUrl: 'https://ops.example', fetcher });
    await expect(client.getOverviewMetrics()).rejects.toMatchObject({
      name: 'OpsHttpError',
      message: 'forbidden',
      status: 403,
    });
    await expect(client.getOverviewMetrics()).rejects.toBeInstanceOf(OpsHttpError);
  });

  it('throws OpsHttpTimeoutError when fetch aborts by timeout', async () => {
    vi.useFakeTimers();

    const fetcher = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
          });
        }),
    );

    const client = new HttpOpsApiClient({
      baseUrl: 'https://ops.example',
      fetcher,
      timeoutMs: 50,
    });

    const pending = client.getOverviewMetrics();
    const rejection = expect(pending).rejects.toBeInstanceOf(OpsHttpTimeoutError);
    await vi.advanceTimersByTimeAsync(60);
    await rejection;
  });

  it('injects Authorization header and fetch credentials without embedding secrets', async () => {
    const fetcher = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.credentials).toBe('include');
      expect(init?.headers).toBeInstanceOf(Headers);
      expect((init?.headers as Headers).get('Authorization')).toBe('Bearer injected');
      return jsonResponse(200, overviewWire);
    });

    const client = new HttpOpsApiClient({
      baseUrl: 'https://ops.example',
      fetcher,
      credentials: 'include',
      getAuthorizationHeader: () => 'Bearer injected',
    });

    await client.getOverviewMetrics();
  });

  it('injects X-Admin-MFA, X-Admin-Role, and getExtraHeaders when configured', async () => {
    const fetcher = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const headers = init?.headers as Headers;
      expect(headers.get('X-Admin-MFA')).toBe('mfa-proof');
      expect(headers.get('X-Admin-Role')).toBe('operator');
      expect(headers.get('X-Trace-Local')).toBe('dev');
      return jsonResponse(200, {
        data_source: 'backend',
        items: [],
      });
    });

    const client = new HttpOpsApiClient({
      baseUrl: 'https://ops.example',
      fetcher,
      getAdminMfaHeader: () => 'mfa-proof',
      getAdminRoleHeader: () => 'operator',
      getExtraHeaders: () => ({ 'X-Trace-Local': 'dev' }),
    });

    await client.listRooms();
  });

  it('uses globalThis-bound default fetcher so detached invocation succeeds', async () => {
    const originalFetch = globalThis.fetch;
    const strictFetch = function (this: unknown, input: RequestInfo | URL) {
      if (this !== globalThis) {
        throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation");
      }
      expect(String(input)).toBe('https://ops.example/admin/v1/metrics/overview');
      return jsonResponse(200, overviewWire);
    };

    globalThis.fetch = strictFetch as unknown as typeof fetch;

    try {
      const client = new HttpOpsApiClient({ baseUrl: 'https://ops.example' });
      const metrics = await client.getOverviewMetrics();
      expect(metrics.dau).toBe(100);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('documents bare fetch fails under strict Window receiver check', () => {
    const originalFetch = globalThis.fetch;
    const strictFetch = function (this: unknown) {
      if (this !== globalThis) {
        throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation");
      }
      return jsonResponse(200, overviewWire);
    };

    globalThis.fetch = strictFetch as unknown as typeof fetch;

    try {
      const bareFetcher = globalThis.fetch;
      expect(() => bareFetcher('https://ops.example/')).toThrow(/Illegal invocation/);
      expect(globalThis.fetch.bind(globalThis)('https://ops.example/')).toBeInstanceOf(Response);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
