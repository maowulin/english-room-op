/** True when Vite env selects HttpOpsApiClient (local FastAPI 联调). */
export function isOpsHttpMode(): boolean {
  return (
    import.meta.env.VITE_OPS_API_MODE === 'http' &&
    Boolean(import.meta.env.VITE_OPS_API_BASE_URL?.trim())
  );
}
