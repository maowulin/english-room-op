/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPS_API_MODE?: 'mock' | 'http';
  readonly VITE_OPS_API_BASE_URL?: string;
  /** Production HTTPS allowlist (comma-separated origins); dev localhost exempt. */
  readonly VITE_OPS_API_ALLOWED_ORIGINS?: string;
  /** Temporary deployment-only escape hatch; remove when HTTPS is available. */
  readonly VITE_OPS_ALLOW_INSECURE_HTTP?: string;
  /** Local 联调 only — never commit real secrets; Backend validates server-side. */
  readonly VITE_OPS_ADMIN_AUTHORIZATION?: string;
  readonly VITE_OPS_ADMIN_MFA?: string;
  readonly VITE_OPS_ADMIN_ROLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
