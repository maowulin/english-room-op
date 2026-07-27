import { useCallback, useEffect, useState } from 'react';

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
      .catch((err: unknown) => {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : '加载失败');
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
