import { describe, expect, it } from 'vitest';

import { readDevOpsAdminHeaders, type OpsDevAdminEnvSource } from './ops-dev-admin-env';

describe('readDevOpsAdminHeaders', () => {
  it('returns no headers when not in dev mode', () => {
    const source: OpsDevAdminEnvSource = {
      dev: false,
      authorization: 'Bearer must-not-leak',
      adminMfa: 'secret-mfa',
      adminRole: 'admin',
    };

    expect(readDevOpsAdminHeaders(source)).toEqual({});
  });

  it('maps dev-only env values when dev mode is true', () => {
    const source: OpsDevAdminEnvSource = {
      dev: true,
      authorization: ' Bearer local ',
      adminMfa: ' dev-mfa ',
      adminRole: 'viewer',
    };

    expect(readDevOpsAdminHeaders(source)).toEqual({
      authorization: 'Bearer local',
      adminMfa: 'dev-mfa',
      adminRole: 'viewer',
    });
  });
});
