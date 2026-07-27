import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearOpsRuntimeAuth,
  getOpsRuntimeAdminMfa,
  getOpsRuntimeAdminRole,
  getOpsRuntimeAuthorization,
  setOpsRuntimeAuth,
} from './ops-runtime-auth';

describe('ops runtime auth bridge', () => {
  afterEach(() => {
    clearOpsRuntimeAuth();
  });

  it('starts with no admin headers', () => {
    expect(getOpsRuntimeAuthorization()).toBeUndefined();
    expect(getOpsRuntimeAdminMfa()).toBeUndefined();
    expect(getOpsRuntimeAdminRole()).toBeUndefined();
  });

  it('setOpsRuntimeAuth exposes values until cleared', () => {
    setOpsRuntimeAuth({
      authorization: 'Bearer runtime-token',
      adminMfa: 'mfa-proof',
      adminRole: 'operator',
    });

    expect(getOpsRuntimeAuthorization()).toBe('Bearer runtime-token');
    expect(getOpsRuntimeAdminMfa()).toBe('mfa-proof');
    expect(getOpsRuntimeAdminRole()).toBe('operator');

    clearOpsRuntimeAuth();
    expect(getOpsRuntimeAuthorization()).toBeUndefined();
  });

  it('reads latest runtime auth on each getter call', () => {
    setOpsRuntimeAuth({ authorization: 'Bearer first' });
    expect(getOpsRuntimeAuthorization()).toBe('Bearer first');

    setOpsRuntimeAuth({ authorization: 'Bearer second' });
    expect(getOpsRuntimeAuthorization()).toBe('Bearer second');
  });

  it('trims whitespace and treats empty strings as absent', () => {
    setOpsRuntimeAuth({
      authorization: '  Bearer x  ',
      adminMfa: '   ',
      adminRole: '',
    });

    expect(getOpsRuntimeAuthorization()).toBe('Bearer x');
    expect(getOpsRuntimeAdminMfa()).toBeUndefined();
    expect(getOpsRuntimeAdminRole()).toBeUndefined();
  });

  it('clears expired auth on getter access without persisting', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-27T02:00:00+08:00'));

    setOpsRuntimeAuth({
      authorization: 'Bearer short-lived',
      expiresAt: Date.parse('2026-07-27T02:00:01+08:00'),
    });

    expect(getOpsRuntimeAuthorization()).toBe('Bearer short-lived');

    vi.setSystemTime(new Date('2026-07-27T02:00:01+08:00'));
    expect(getOpsRuntimeAuthorization()).toBeUndefined();
    expect(getOpsRuntimeAdminMfa()).toBeUndefined();

    vi.useRealTimers();
  });
});
