// Single source of truth for the seasons the UI queries.
//
// The 2026 calendar is the *upcoming* season (races scheduled, no results yet),
// so championship standings show the last *completed* season (2024). Keeping
// these here means changing the displayed season is a one-line edit instead of
// hunting hardcoded years across a dozen files.

export const RACE_SEASON = 2026; // upcoming race calendar
export const STANDINGS_SEASON = 2024; // last completed championship
export const CALENDAR_ROUNDS = 24;

// Seasons offered in any season picker (must have data seeded).
export const SEASONS = [2026, 2024];
export const STANDINGS_SEASONS = [2024];
