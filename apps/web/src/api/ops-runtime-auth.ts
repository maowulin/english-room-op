export type OpsRuntimeAuth = {
  authorization?: string;
  adminMfa?: string;
  adminRole?: string;
  /** Epoch milliseconds; when reached, getters clear the expired session. */
  expiresAt?: number;
};

const AUTH_STORAGE_KEY = 'english-room.ops.auth';
let runtimeAuth: OpsRuntimeAuth | null = null;

function trimOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function getSessionStorage(): Storage | undefined {
  if (typeof globalThis.sessionStorage === 'undefined') return undefined;
  return globalThis.sessionStorage;
}

function removePersistedAuth(): void {
  getSessionStorage()?.removeItem(AUTH_STORAGE_KEY);
}

function clearIfExpired(): void {
  if (runtimeAuth?.expiresAt !== undefined && Date.now() >= runtimeAuth.expiresAt) {
    runtimeAuth = null;
    removePersistedAuth();
  }
}

export function setOpsRuntimeAuth(auth: OpsRuntimeAuth): void {
  runtimeAuth = {
    authorization: trimOptional(auth.authorization),
    adminMfa: trimOptional(auth.adminMfa),
    adminRole: trimOptional(auth.adminRole),
    expiresAt: auth.expiresAt,
  };
  getSessionStorage()?.setItem(AUTH_STORAGE_KEY, JSON.stringify(runtimeAuth));
  clearIfExpired();
}

export function clearOpsRuntimeAuth(): void {
  runtimeAuth = null;
  removePersistedAuth();
}

export function restoreOpsRuntimeAuth(): void {
  const storage = getSessionStorage();
  const raw = storage?.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    runtimeAuth = null;
    return;
  }

  try {
    const parsed = JSON.parse(raw) as OpsRuntimeAuth;
    if (!parsed || typeof parsed !== 'object') throw new Error('invalid persisted auth');
    setOpsRuntimeAuth(parsed);
  } catch {
    runtimeAuth = null;
    storage?.removeItem(AUTH_STORAGE_KEY);
  }
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
