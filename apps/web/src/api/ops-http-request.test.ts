import { describe, expect, it, vi } from 'vitest';

import { opsFetchJson, type OpsHttpRequestConfig } from './ops-http-request';

describe('opsFetchJson admin headers', () => {
  it('omits empty optional headers', async () => {
    const fetcher = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const headers = init?.headers as Headers;
      expect(headers.get('X-Admin-MFA')).toBeNull();
      expect(headers.get('X-Admin-Role')).toBeNull();
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    const config: OpsHttpRequestConfig = {
      baseUrl: 'https://ops.example',
      fetcher,
      getAdminMfaHeader: () => undefined,
      getAdminRoleHeader: async () => '',
    };

    await opsFetchJson(config, 'GET', '/admin/v1/rooms');
  });

  it('ignores case-insensitive protected headers from getExtraHeaders', async () => {
    const fetcher = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const headers = init?.headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer primary');
      expect(headers.get('X-Admin-MFA')).toBe('mfa-primary');
      expect(headers.get('X-Admin-Role')).toBe('operator');
      expect(headers.get('X-Trace-Local')).toBe('dev');
      expect(headers.get('cookie')).toBeNull();
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    const config: OpsHttpRequestConfig = {
      baseUrl: 'https://ops.example',
      fetcher,
      assertBaseUrlAllowed: () => undefined,
      getAuthorizationHeader: () => 'Bearer primary',
      getAdminMfaHeader: () => 'mfa-primary',
      getAdminRoleHeader: () => 'operator',
      getExtraHeaders: () => ({
        authorization: 'Bearer hijack',
        'X-ADMIN-MFA': 'hijack-mfa',
        'x-admin-role': 'admin',
        Cookie: 'session=hijack',
        'X-Trace-Local': 'dev',
      }),
    };

    await opsFetchJson(config, 'GET', '/admin/v1/rooms');
  });

  it('does not call fetch when base URL policy blocks the request', async () => {
    const fetcher = vi.fn();

    const config: OpsHttpRequestConfig = {
      baseUrl: 'https://evil.example',
      fetcher,
      assertBaseUrlAllowed: () => {
        throw new Error('blocked');
      },
    };

    await expect(opsFetchJson(config, 'GET', '/admin/v1/rooms')).rejects.toThrow('blocked');
    expect(fetcher).not.toHaveBeenCalled();
  });
});
