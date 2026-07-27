import { describe, expect, it } from 'vitest';

import {
  assertOpsApiBaseUrlAllowed,
  OpsApiBaseUrlBlockedError,
} from './ops-api-base-url-policy';

describe('assertOpsApiBaseUrlAllowed', () => {
  it('allows localhost HTTP in non-production without allowlist', () => {
    expect(() =>
      assertOpsApiBaseUrlAllowed('http://127.0.0.1:8000', { isProduction: false }),
    ).not.toThrow();
    expect(() =>
      assertOpsApiBaseUrlAllowed('http://localhost:5173', { isProduction: false }),
    ).not.toThrow();
  });

  it('blocks non-localhost in non-production when allowlist is missing', () => {
    expect(() =>
      assertOpsApiBaseUrlAllowed('https://ops.example', { isProduction: false }),
    ).toThrow(OpsApiBaseUrlBlockedError);
  });

  it('allows matching HTTPS origin from allowlist in production', () => {
    expect(() =>
      assertOpsApiBaseUrlAllowed('https://ops.example/admin', {
        isProduction: true,
        allowedOriginsCsv: 'https://ops.example',
      }),
    ).not.toThrow();
  });

  it('blocks production HTTP and missing allowlist', () => {
    expect(() =>
      assertOpsApiBaseUrlAllowed('http://127.0.0.1:8000', { isProduction: true }),
    ).toThrow(/HTTPS/);

    expect(() =>
      assertOpsApiBaseUrlAllowed('https://ops.example', {
        isProduction: true,
        allowedOriginsCsv: '',
      }),
    ).toThrow(/VITE_OPS_API_ALLOWED_ORIGINS/);
  });

  it('blocks production when origin is not on allowlist', () => {
    expect(() =>
      assertOpsApiBaseUrlAllowed('https://evil.example', {
        isProduction: true,
        allowedOriginsCsv: 'https://ops.example',
      }),
    ).toThrow(/allowlist/);
  });
});
