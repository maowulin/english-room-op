/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPS_API_MODE?: 'mock' | 'http';
  readonly VITE_OPS_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
