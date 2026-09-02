import { useState, useEffect, useCallback, useRef } from "react";

/* ---------------------------------------------------------------------------
   useFetch — async data with an optional stale-while-revalidate cache.

   Pass `{ key }` and the hook remembers the last result under that key for
   the session: the next mount with the same key renders the cached data
   immediately (no spinner) and refreshes it in the background, so moving
   between pages feels instant while the data still stays current. Without a
   key it behaves exactly as before (fetch on mount, loading state).

   `prefetch(key, fetcher)` warms the cache ahead of navigation.
   ------------------------------------------------------------------------- */

const MAX_ENTRIES = 60;
const cache = new Map(); // key -> { data, at }

function remember(key, data) {
  if (!key || data === undefined) return;
  cache.delete(key);
  cache.set(key, { data, at: Date.now() });
  if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value);
}

/** Warm the cache for a key (no-op if it's already there or in flight). */
const inflight = new Map();
export function prefetch(key, fetcher) {
  if (!key || cache.has(key) || inflight.has(key)) return;
  // Register the raw promise (it resolves to the data) so a page mounting
  // mid-flight can await the same request and still receive the result.
  const p = Promise.resolve().then(fetcher);
  inflight.set(key, p);
  p.then((d) => remember(key, d))
    .catch(() => {})
    .finally(() => inflight.delete(key));
}

/** Drop cached entries (all, or those whose key starts with `prefix`). */
export function invalidate(prefix) {
  if (!prefix) return cache.clear();
  for (const k of [...cache.keys()]) if (k.startsWith(prefix)) cache.delete(k);
}

/**
 * Runs an async `fetcher` and tracks { data, loading, error }. Re-runs when any
 * value in `deps` changes, and exposes `refetch()` to run it again on demand.
 * Guards against setting state after unmount.
 *
 * @param {() => Promise<any>} fetcher
 * @param {any[]} deps
 * @param {{ key?: string }} [options]  cache key for stale-while-revalidate
 */
export function useFetch(fetcher, deps = [], { key } = {}) {
  const cached = key ? cache.get(key) : undefined;
  const [data, setData] = useState(cached ? cached.data : null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);
  const keyRef = useRef(key);
  keyRef.current = key;

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    const hit = key ? cache.get(key) : undefined;
    if (hit) {
      // Serve the cached copy now; the fetch below refreshes it quietly.
      setData(hit.data);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);
    // Same key already loading (a second mount, StrictMode's double effect,
    // two components wanting the same data)? Share that request.
    let p = key ? inflight.get(key) : undefined;
    if (!p) {
      p = Promise.resolve().then(fetcher);
      if (key) {
        inflight.set(key, p);
        p.finally(() => inflight.delete(key)).catch(() => {});
      }
    }
    p
      .then((d) => {
        remember(keyRef.current, d);
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
  }, [...deps, nonce, key]);

  return { data, loading, error, refetch, setData };
}
