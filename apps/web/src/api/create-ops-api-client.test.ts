import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OpsApiBaseUrlBlockedError } from './ops-api-base-url-policy';
import { clearOpsRuntimeAuth, setOpsRuntimeAuth } from './ops-runtime-auth';
import { createOpsApiClient } from './create-ops-api-client';
import { HttpOpsApiClient } from './http-ops-api-client';
import { MockOpsApiClient } from './mock-ops-api-client';

describe('createOpsApiClient', () => {
  beforeEach(() => {
    clearOpsRuntimeAuth();
  });

  afterEach(() => {
    clearOpsRuntimeAuth();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('uses MockOpsApiClient only when mock mode is explicit', () => {
    vi.stubEnv('VITE_OPS_API_MODE', 'mock');
    vi.stubEnv('VITE_OPS_API_BASE_URL', '');

    expect(createOpsApiClient()).toBeInstanceOf(MockOpsApiClient);
  });

  it('uses HttpOpsApiClient by default when the backend URL is configured', () => {
    vi.stubEnv('VITE_OPS_API_MODE', '');
    vi.stubEnv('VITE_OPS_API_BASE_URL', 'https://ops.example');

    expect(createOpsApiClient()).toBeInstanceOf(HttpOpsApiClient);
  });

  it('reports a configuration error instead of falling back to demo data', async () => {
    vi.stubEnv('VITE_OPS_API_MODE', '');
    vi.stubEnv('VITE_OPS_API_BASE_URL', '');

    await expect(createOpsApiClient().getOverviewMetrics()).rejects.toThrow(
      'VITE_OPS_API_BASE_URL',
    );
  });

  it('refuses HttpOpsApiClient when base URL origin is not allowlisted', () => {
    vi.stubEnv('VITE_OPS_API_MODE', 'http');
    vi.stubEnv('VITE_OPS_API_BASE_URL', 'https://evil.example');

    expect(() => createOpsApiClient()).toThrow(OpsApiBaseUrlBlockedError);
  });

  it('HttpOpsApiClient sends runtime auth headers on each request', async () => {
    vi.stubEnv('VITE_OPS_API_MODE', 'http');
    vi.stubEnv('VITE_OPS_API_BASE_URL', 'https://ops.example');
    vi.stubEnv('VITE_OPS_API_ALLOWED_ORIGINS', 'https://ops.example');
    vi.stubEnv('VITE_OPS_ADMIN_AUTHORIZATION', 'Bearer from-env-should-not-win');

    setOpsRuntimeAuth({
      authorization: 'Bearer runtime',
      adminMfa: 'runtime-mfa',
      adminRole: 'operator',
    });

    const fetcher = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.credentials).toBe('include');
      return new Response(
        JSON.stringify({
          data_source: 'backend',
          total_stored_events: 1,
          unique_user_ids: 1,
          counts_by_event_name: {},
          generated_at: '2026-07-27T01:00:00+08:00',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    vi.stubGlobal('fetch', fetcher);

    const client = createOpsApiClient();
    expect(client).toBeInstanceOf(HttpOpsApiClient);

    await client.getOverviewMetrics();

    const firstHeaders = (fetcher.mock.calls[0]?.[1] as RequestInit).headers as Headers;
    expect(firstHeaders.get('Authorization')).toBe('Bearer runtime');
    expect(firstHeaders.get('X-Admin-MFA')).toBe('runtime-mfa');
    expect(firstHeaders.get('X-Admin-Role')).toBe('operator');

    clearOpsRuntimeAuth();
    setOpsRuntimeAuth({ authorization: 'Bearer updated' });

    await client.getOverviewMetrics();

    expect(fetcher).toHaveBeenCalledTimes(2);
    const secondHeaders = (fetcher.mock.calls[1]?.[1] as RequestInit).headers as Headers;
    expect(secondHeaders.get('Authorization')).toBe('Bearer updated');
  });
});
