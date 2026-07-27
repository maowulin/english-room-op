export type OpsRuntimeAuth = {
  authorization?: string;
  adminMfa?: string;
  adminRole?: string;
  /** Epoch milliseconds; when reached, getters clear auth in memory (not persisted). */
  expiresAt?: number;
};

let runtimeAuth: OpsRuntimeAuth | null = null;

function trimOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function clearIfExpired(): void {
  if (runtimeAuth?.expiresAt !== undefined && Date.now() >= runtimeAuth.expiresAt) {
    runtimeAuth = null;
  }
}

export function setOpsRuntimeAuth(auth: OpsRuntimeAuth): void {
  runtimeAuth = {
    authorization: trimOptional(auth.authorization),
    adminMfa: trimOptional(auth.adminMfa),
    adminRole: trimOptional(auth.adminRole),
    expiresAt: auth.expiresAt,
  };
  clearIfExpired();
}

export function clearOpsRuntimeAuth(): void {
  runtimeAuth = null;
}

export function getOpsRuntimeAuthorization(): string | undefined {
  clearIfExpired();
  return runtimeAuth?.authorization;
}

export function getOpsRuntimeAdminMfa(): string | undefined {
  clearIfExpired();
  return runtimeAuth?.adminMfa;
}

export function getOpsRuntimeAdminRole(): string | undefined {
  clearIfExpired();
  return runtimeAuth?.adminRole;
}
