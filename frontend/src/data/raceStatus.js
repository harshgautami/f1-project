/* ---------------------------------------------------------------------------
   A race's stored `status` is a snapshot taken when the calendar was written:
   backend/scripts/sync.js sets it from the date at sync time, and the admin
   screens edit it by hand. A calendar that isn't re-synced therefore goes
   stale as the season runs — every round still reads "upcoming" weeks after
   it has been won.

   The user-facing pages ask for the *effective* status instead: the stored
   value, promoted to "completed" once the date has passed. It only ever moves
   upcoming → completed, so freshly synced data is left exactly as it is, and
   an explicit "cancelled" is always honoured. The admin managers keep showing
   (and editing) the raw stored field.
   ------------------------------------------------------------------------- */

/**
 * Effective status of a race.
 * @returns {"completed"|"upcoming"|"cancelled"}
 */
export function raceStatus(race, now = Date.now()) {
  if (!race) return "upcoming";
  if (race.status === "cancelled") return "cancelled";
  if (race.status === "completed") return "completed";
  // A classification is proof it ran, whatever the status field says.
  if (race.results && race.results.length > 0) return "completed";
  const at = race.date ? new Date(race.date).getTime() : NaN;
  return Number.isFinite(at) && at <= now ? "completed" : "upcoming";
}

/** Has this round been run? */
export const hasRun = (race, now) => raceStatus(race, now) === "completed";

/** Rows with their effective status in place of the stored one, in calendar
    order — what every user-facing list actually wants to render. */
export function withStatus(races, now = Date.now()) {
  return [...(races || [])]
    .sort((a, b) => (a.round || 0) - (b.round || 0))
    .map((r) => ({ ...r, status: raceStatus(r, now) }));
}

/** The next round still to be run (calendar order), or null. */
export function nextRaceOf(races = [], now = Date.now()) {
  return withStatus(races, now).find((r) => r.status === "upcoming") || null;
}

/** The most recent round already run, or null. */
export function lastRaceOf(races = [], now = Date.now()) {
  const run = withStatus(races, now).filter((r) => r.status === "completed");
  return run[run.length - 1] || null;
}
