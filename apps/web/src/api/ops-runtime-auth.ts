export type OpsRuntimeAuth = {
  authorization?: string;
  adminMfa?: string;
  adminRole?: string;
};

let runtimeAuth: OpsRuntimeAuth | null = null;

function trimOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function setOpsRuntimeAuth(auth: OpsRuntimeAuth): void {
  runtimeAuth = {
    authorization: trimOptional(auth.authorization),
    adminMfa: trimOptional(auth.adminMfa),
    adminRole: trimOptional(auth.adminRole),
  };
}

export function clearOpsRuntimeAuth(): void {
  runtimeAuth = null;
}

export function getOpsRuntimeAuthorization(): string | undefined {
  return runtimeAuth?.authorization;
}

export function getOpsRuntimeAdminMfa(): string | undefined {
  return runtimeAuth?.adminMfa;
}

export function getOpsRuntimeAdminRole(): string | undefined {
  return runtimeAuth?.adminRole;
}
