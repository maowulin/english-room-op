export class OpsApiBaseUrlBlockedError extends Error {
  readonly name = 'OpsApiBaseUrlBlockedError';

  constructor(message: string) {
    super(message);
  }
}

export type OpsApiBaseUrlPolicyContext = {
  isProduction: boolean;
  allowedOriginsCsv?: string;
};

const LOCAL_DEV_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

function parseAllowedOrigins(csv: string | undefined): Set<string> {
  const origins = new Set<string>();
  if (!csv?.trim()) {
    return origins;
  }

  for (const entry of csv.split(',')) {
    const trimmed = entry.trim();
    if (!trimmed) {
      continue;
    }
    try {
      origins.add(new URL(trimmed).origin);
    } catch {
      origins.add(trimmed);
    }
  }

  return origins;
}

function isLocalDevOrigin(url: URL): boolean {
  return (
    LOCAL_DEV_HOSTNAMES.has(url.hostname) &&
    (url.protocol === 'http:' || url.protocol === 'https:')
  );
}

export function assertOpsApiBaseUrlAllowed(
  baseUrl: string,
  ctx: OpsApiBaseUrlPolicyContext,
): void {
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new OpsApiBaseUrlBlockedError('运营台 API base URL 无效');
  }

  if (!ctx.isProduction && isLocalDevOrigin(parsed)) {
    return;
  }

  if (ctx.isProduction && parsed.protocol !== 'https:') {
    throw new OpsApiBaseUrlBlockedError('生产环境运营台 API 必须使用 HTTPS');
  }

  const allowed = parseAllowedOrigins(ctx.allowedOriginsCsv);
  if (allowed.size === 0) {
    throw new OpsApiBaseUrlBlockedError('缺少 VITE_OPS_API_ALLOWED_ORIGINS 配置');
  }

  if (!allowed.has(parsed.origin)) {
    throw new OpsApiBaseUrlBlockedError(`运营台 API origin 不在 allowlist：${parsed.origin}`);
  }
}

export function readOpsApiBaseUrlPolicyFromEnv(): OpsApiBaseUrlPolicyContext {
  return {
    isProduction: import.meta.env.PROD,
    allowedOriginsCsv: import.meta.env.VITE_OPS_API_ALLOWED_ORIGINS,
  };
}

export function assertOpsApiBaseUrlAllowedFromEnv(baseUrl: string): void {
  assertOpsApiBaseUrlAllowed(baseUrl, readOpsApiBaseUrlPolicyFromEnv());
}
