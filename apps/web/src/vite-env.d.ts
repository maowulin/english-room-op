/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPS_API_MODE?: 'mock' | 'http';
  readonly VITE_OPS_API_BASE_URL?: string;
  /** Local 联调 only — never commit real secrets; Backend validates server-side. */
  readonly VITE_OPS_ADMIN_AUTHORIZATION?: string;
  readonly VITE_OPS_ADMIN_MFA?: string;
  readonly VITE_OPS_ADMIN_ROLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
