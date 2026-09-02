// Single source of truth for the seasons the UI queries.
//
// The app syncs real F1 data from the Jolpica API (the maintained Ergast
// successor) — see backend/scripts/sync.js. Standings, race calendars AND real
// per-race results are stored per season, so the UI can browse history and the
// Live tracker can replay any past Grand Prix to its real finishing order.

export const RACE_SEASON = 2026; // current race calendar
export const STANDINGS_SEASON = 2026; // current championship
export const CALENDAR_ROUNDS = 24;

// Every season with data in the DB, newest first: the backend keeps the last
// 13 seasons plus the current one (HISTORY_YEARS in backend/scripts/sync.js).
const FIRST_SEASON = 2013;
const LATEST_SEASON = 2026;
export const SEASONS = Array.from(
  { length: LATEST_SEASON - FIRST_SEASON + 1 },
  (_, i) => LATEST_SEASON - i,
);
export const STANDINGS_SEASONS = SEASONS;
