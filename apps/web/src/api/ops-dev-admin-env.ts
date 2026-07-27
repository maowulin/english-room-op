export type OpsDevAdminEnvSource = {
  dev: boolean;
  authorization?: string;
  adminMfa?: string;
  adminRole?: string;
};

function trimOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function readDevOpsAdminHeaders(
  source: OpsDevAdminEnvSource,
): Pick<OpsDevAdminEnvSource, 'authorization' | 'adminMfa' | 'adminRole'> {
  if (!source.dev) {
    return {};
  }

  return {
    authorization: trimOptional(source.authorization),
    adminMfa: trimOptional(source.adminMfa),
    adminRole: trimOptional(source.adminRole),
  };
}

/** Vite `VITE_OPS_ADMIN_*` — local dev only; production builds must not rely on these. */
export function getDevOpsAdminHeaders(): ReturnType<typeof readDevOpsAdminHeaders> {
  if (!import.meta.env.DEV) {
    return {};
  }

  return readDevOpsAdminHeaders({
    dev: true,
    authorization: import.meta.env.VITE_OPS_ADMIN_AUTHORIZATION,
    adminMfa: import.meta.env.VITE_OPS_ADMIN_MFA,
    adminRole: import.meta.env.VITE_OPS_ADMIN_ROLE,
  });
}
