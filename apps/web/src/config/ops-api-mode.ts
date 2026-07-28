/** True when Vite env selects the real FastAPI client. */
export function isOpsHttpMode(): boolean {
  return (
    import.meta.env.VITE_OPS_API_MODE !== 'mock' &&
    Boolean(import.meta.env.VITE_OPS_API_BASE_URL?.trim())
  );
}

/** True only for the explicit local/demo data mode. */
export function isOpsDemoMode(): boolean {
  return import.meta.env.VITE_OPS_API_MODE === 'mock';
}
