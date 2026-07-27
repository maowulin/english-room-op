import { useCallback, useEffect, useState } from 'react';

import { OPS_GENERIC_ERROR_MESSAGE } from '../api/ops-http-request';

export type OpsQueryState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  retry: () => void;
};

export function useOpsQuery<T>(load: () => Promise<T>, deps: readonly unknown[] = []): OpsQueryState<T> {
  const [reloadToken, setReloadToken] = useState(0);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const retry = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    load()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          // Backend details may contain HTML, stack traces, or sensitive request data.
          // Keep the page-level error intentionally generic; diagnostics stay in devtools/server logs.
          setError(OPS_GENERIC_ERROR_MESSAGE);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reloadToken + caller deps drive refetch
  }, [reloadToken, ...deps]);

  return { data, error, loading, retry };
}
