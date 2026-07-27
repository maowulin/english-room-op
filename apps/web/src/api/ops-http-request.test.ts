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
});
