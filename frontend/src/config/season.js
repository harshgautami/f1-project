// Single source of truth for the seasons the UI queries.
//
// The app now syncs the CURRENT season from the live F1 API (see
// backend/scripts/sync.js), so races AND standings are the current season.
// Changing the displayed season is a one-line edit instead of hunting
// hardcoded years across a dozen files.

export const RACE_SEASON = 2026; // current race calendar
export const STANDINGS_SEASON = 2026; // current championship
export const CALENDAR_ROUNDS = 24;

// Seasons offered in any season picker (must have data in the DB).
export const SEASONS = [2026];
export const STANDINGS_SEASONS = [2026];
