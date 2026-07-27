import type { ReactNode } from 'react';

type OpsQueryStatusProps = {
  loading: boolean;
  error: string | null;
  loadingLabel: string;
  onRetry: () => void;
  children: ReactNode;
};

export function OpsQueryStatus({
  loading,
  error,
  loadingLabel,
  onRetry,
  children,
}: OpsQueryStatusProps) {
  if (error) {
    return (
      <div className="ops-query-error">
        <p role="alert">{error}</p>
        <button type="button" className="btn" onClick={onRetry}>
          重试
        </button>
      </div>
    );
  }

  if (loading) {
    return <p aria-busy="true">{loadingLabel}</p>;
  }

  return children;
}
