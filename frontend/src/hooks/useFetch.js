import { useState, useEffect, useCallback } from "react";

/**
 * Runs an async `fetcher` and tracks { data, loading, error }. Re-runs when any
 * value in `deps` changes, and exposes `refetch()` to run it again on demand.
 * Guards against setting state after unmount.
 *
 * @param {() => Promise<any>} fetcher
 * @param {any[]} deps
 */
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.resolve(fetcher())
      .then((d) => {
        if (alive) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e?.response?.data?.message || "Failed to load data");
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, loading, error, refetch, setData };
}
