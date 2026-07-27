export type OpsHttpFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type OpsHttpCredentials = RequestCredentials;

export interface OpsHttpRequestConfig {
  baseUrl: string;
  fetcher: OpsHttpFetcher;
  credentials?: OpsHttpCredentials;
  timeoutMs?: number;
  getAuthorizationHeader?: () => string | Promise<string | undefined>;
}

export class OpsHttpError extends Error {
  readonly name = 'OpsHttpError';

  constructor(
    message: string,
    readonly status: number,
    readonly statusText: string,
    readonly body: unknown,
  ) {
    super(message);
  }
}

export class OpsHttpTimeoutError extends Error {
  readonly name = 'OpsHttpTimeoutError';

  constructor(message = '运营台 API 请求超时') {
    super(message);
  }
}

function trimTrailingSlash(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

export function buildOpsAdminUrl(baseUrl: string, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${trimTrailingSlash(baseUrl)}${normalizedPath}`;
}

async function parseJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function errorMessageFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message) {
      return record.message;
    }
    if (typeof record.detail === 'string' && record.detail) {
      return record.detail;
    }
  }

  if (typeof body === 'string' && body) {
    return body;
  }

  return fallback;
}

export async function opsFetchJson<T>(
  config: OpsHttpRequestConfig,
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<T> {
  const timeoutMs = config.timeoutMs ?? 30_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers({ Accept: 'application/json' });
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const authorization = config.getAuthorizationHeader
    ? await config.getAuthorizationHeader()
    : undefined;
  if (authorization) {
    headers.set('Authorization', authorization);
  }

  let response: Response;
  try {
    response = await config.fetcher(buildOpsAdminUrl(config.baseUrl, path), {
      method,
      headers,
      credentials: config.credentials,
      signal: controller.signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new OpsHttpTimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const parsed = await parseJsonBody(response);

  if (!response.ok) {
    const fallback = `${method} ${path} failed with ${response.status} ${response.statusText}`;
    throw new OpsHttpError(errorMessageFromBody(parsed, fallback), response.status, response.statusText, parsed);
  }

  return parsed as T;
}
