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

describe('HttpOpsApiClient', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('GET /admin/v1/metrics/overview returns parsed JSON', async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      expect(String(url)).toBe('https://ops.example/admin/v1/metrics/overview');
      return jsonResponse(200, {
        dau: 100,
        dauDeltaPercent: 1,
        d1RetentionRate: 0.5,
        d7RetentionRate: 0.3,
        roomConversionRate: 0.2,
        scoringCompletionRate: 0.9,
      });
    });

    const client = new HttpOpsApiClient({
      baseUrl: 'https://ops.example',
      fetcher,
    });

    const metrics = await client.getOverviewMetrics();
    expect(metrics.dau).toBe(100);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('GET /admin/v1/metrics/stability uses stability path', async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      expect(String(url)).toBe('https://ops.example/admin/v1/metrics/stability');
      return jsonResponse(200, {
        errorTrend: [],
        affectedUsersPlaceholder: 0,
        topIssues: [],
      });
    });

    const client = new HttpOpsApiClient({ baseUrl: 'https://ops.example', fetcher });
    await client.getStabilitySummary();
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('GET /admin/v1/rooms, /scoring, /audit/events hit expected paths', async () => {
    const seen: string[] = [];
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      seen.push(String(url));
      if (String(url).endsWith('/rooms')) {
        return jsonResponse(200, { rooms: [] });
      }
      if (String(url).endsWith('/scoring')) {
        return jsonResponse(200, { tasks: [] });
      }
      if (String(url).endsWith('/audit/events')) {
        return jsonResponse(200, { entries: [] });
      }
      return jsonResponse(404, { message: 'not found' });
    });

    const client = new HttpOpsApiClient({ baseUrl: 'https://ops.example/', fetcher });
    await client.listRooms();
    await client.listScoringTasks();
    await client.listAuditLog();

    expect(seen).toEqual([
      'https://ops.example/admin/v1/rooms',
      'https://ops.example/admin/v1/scoring',
      'https://ops.example/admin/v1/audit/events',
    ]);
  });

  it('POST /admin/v1/scoring/{id}/retry sends POST without client-side mock payload', async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe('https://ops.example/admin/v1/scoring/task-1/retry');
      expect(init?.method).toBe('POST');
      expect(init?.body).toBeUndefined();
      return jsonResponse(200, {
        taskId: 'task-1',
        status: 'mock_accepted',
        message: 'accepted',
      });
    });

    const client = new HttpOpsApiClient({ baseUrl: 'https://ops.example', fetcher });
    const result = await client.retryScoringTask('task-1');
    expect(result.taskId).toBe('task-1');
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
      return jsonResponse(200, {
        dau: 1,
        dauDeltaPercent: 0,
        d1RetentionRate: 0,
        d7RetentionRate: 0,
        roomConversionRate: 0,
        scoringCompletionRate: 0,
      });
    });

    const client = new HttpOpsApiClient({
      baseUrl: 'https://ops.example',
      fetcher,
      credentials: 'include',
      getAuthorizationHeader: () => 'Bearer injected',
    });

    await client.getOverviewMetrics();
  });
});
