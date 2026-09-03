import { useCallback, useEffect, useRef, useState } from "react";
import { seasonsOf } from "../data/loaders";

/* ---------------------------------------------------------------------------
   Season-picker state backed by what the database actually holds.

   config/season.js describes the seasons a *fully synced* database has. A
   deployment that was seeded before the sync existed, or one that stops short
   of the current year, has fewer — and a page that defaults to the current
   season then renders an empty championship even though there is plenty of
   data one year back.

   So: render immediately on `preferred` with the static list, then swap in
   the real one from `<endpoint>/seasons`. If `preferred` isn't among them,
   move to the newest season that is. A season the visitor picked themselves
   always wins over that correction.
   ------------------------------------------------------------------------- */

export function useSeasons(endpoint, preferred, fallback) {
  const [seasons, setSeasons] = useState(fallback);
  const [season, setSeason] = useState(preferred);
  const picked = useRef(false);

  useEffect(() => {
    let alive = true;
    seasonsOf(endpoint).then((list) => {
      if (!alive || !list.length) return;
      setSeasons(list);
      // Newest first, so list[0] is the freshest season with data.
      if (!picked.current && !list.includes(preferred)) setSeason(list[0]);
    });
    return () => {
      alive = false;
    };
  }, [endpoint, preferred]);

  const choose = useCallback((value) => {
    picked.current = true;
    setSeason(Number(value));
  }, []);

  return { season, seasons, setSeason: choose };
}
