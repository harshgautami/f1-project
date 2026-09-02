/* ---------------------------------------------------------------------------
   Real F1 data sync — Jolpica-F1 API (the maintained Ergast successor).

   No API key is needed: https://api.jolpi.ca/ergast/f1 is free and public
   (fair-use limits: ~4 req/s burst, ~500 req/hour sustained — requests below
   are paced and back off on 429).

   What comes from the API (nothing here is hand-typed):
     · calendar + real classified results for every round      → Race
     · driver + constructor championship tables per season     → Standing
     · season summaries (champions, wins per team)              → RaceHistory
     · the CURRENT grid: constructors, drivers, numbers, codes  → Team / Driver
     · driver careers (every start they ever made → per-season
       wins/podiums/points/position, titles, career totals)    → Driver
     · constructor titles + first entry year                    → Team
   Hand-maintained (see rosterMeta.js): team colours, base, power unit, and the
   team-staff roster — none of which any results API provides.

   Everything is UPSERTED on stable Jolpica ids (constructorId / driverId /
   season+round / season+type+position), so re-running is safe and idempotent.

   Usage (from backend/):
     node scripts/sync.js                  # current season (+ roster, careers)
     node scripts/sync.js 2024             # one season
     node scripts/sync.js 2013-2026        # an inclusive range, oldest → newest
     node scripts/sync.js --all            # SEASON_FROM..current (13 yrs + now)
   Flags:
     --prune        also delete roster docs (teams/drivers/staff) not on the
                    current grid, and season data outside the history window
     --refresh      re-fetch results for rounds that already have them
     --no-careers   skip the per-driver career build (fewer requests)
     --dry-run      fetch + summarise the season, write nothing

   Exposes syncSeason() / syncRange() for programmatic use (assumes mongoose
   is already connected). Requires Node 18+ (global fetch).
   --------------------------------------------------------------------------- */

const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Team = require("../models/Team");
const Driver = require("../models/Driver");
const Race = require("../models/Race");
const Standing = require("../models/Standing");
const TeamStaff = require("../models/TeamStaff");
const RaceHistory = require("../models/RaceHistory");
const { TEAM_COLORS, TEAM_META, TEAM_STAFF, teamPrincipalFor } = require("./rosterMeta");

const API = "https://api.jolpi.ca/ergast/f1";
const CURRENT_YEAR = new Date().getFullYear();
/** Seasons of history kept alongside the current one. */
const HISTORY_YEARS = 13;
const SEASON_FROM = CURRENT_YEAR - HISTORY_YEARS;
/** First season with a constructors' championship. */
const FIRST_CONSTRUCTOR_SEASON = 1958;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const colorFor = (constructorId) => TEAM_COLORS[constructorId] || "#e10600";
const fullName = (d) => `${d.givenName} ${d.familyName}`;

/* ---- HTTP ------------------------------------------------------------------ */

// Politely paced GET with a per-process cache (champion lookups repeat across
// drivers/teams in one run) and 429 back-off honouring Retry-After.
const MIN_GAP_MS = 280;
const _cache = new Map();
let _lastReqAt = 0;
let requestCount = 0;

async function get(pathname, { retries = 6 } = {}) {
  if (_cache.has(pathname)) return _cache.get(pathname);
  const url = `${API}/${pathname}`;
  for (let attempt = 0; ; attempt++) {
    const wait = MIN_GAP_MS - (Date.now() - _lastReqAt);
    if (wait > 0) await sleep(wait);
    _lastReqAt = Date.now();
    requestCount++;
    let res;
    try {
      res = await fetch(url, { headers: { "User-Agent": "f1-management-sync" } });
    } catch (err) {
      if (attempt < retries) {
        await sleep(Math.min(2 ** attempt, 30) * 1000);
        continue;
      }
      throw err;
    }
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      const retryAfter =
        parseInt(res.headers.get("retry-after")) || Math.min(2 ** attempt, 30);
      await sleep(retryAfter * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
    const json = await res.json();
    _cache.set(pathname, json);
    return json;
  }
}

/** Follows Ergast-style offset pagination and returns every page's payload. */
async function getAllPages(pathname, pick, { limit = 100 } = {}) {
  const out = [];
  for (let offset = 0; ; offset += limit) {
    const sep = pathname.includes("?") ? "&" : "?";
    const data = await get(`${pathname}${sep}limit=${limit}&offset=${offset}`);
    const total = parseInt(data.MRData.total) || 0;
    out.push(...pick(data.MRData));
    if (offset + limit >= total) break;
  }
  return out;
}

/* ---- Fetchers (pure: no DB writes) ------------------------------------------ */

/** Real classified result for one Grand Prix. Null if not yet published. */
async function fetchRaceResults(season, round) {
  const data = await get(`${season}/${round}/results.json?limit=100`);
  const race = data.MRData.RaceTable.Races[0];
  if (!race || !Array.isArray(race.Results) || !race.Results.length) return null;

  let fastest = null;
  const results = race.Results.map((r) => {
    const flapTime = r.FastestLap && r.FastestLap.Time && r.FastestLap.Time.time;
    const isFastest = !!(r.FastestLap && r.FastestLap.rank === "1");
    const row = {
      position: parseInt(r.position) || 999,
      positionText: r.positionText,
      driver: fullName(r.Driver),
      code: r.Driver.code || r.Driver.familyName.slice(0, 3).toUpperCase(),
      number: parseInt(r.number) || parseInt(r.Driver.permanentNumber) || 0,
      team: r.Constructor.name,
      color: colorFor(r.Constructor.constructorId),
      grid: parseInt(r.grid) || 0,
      laps: parseInt(r.laps) || 0,
      status: r.status,
      time: (r.Time && r.Time.time) || r.status,
      points: parseFloat(r.points) || 0,
      fastestLap: isFastest,
    };
    if (isFastest) fastest = { code: row.code, time: flapTime };
    return row;
  });

  const winner = results.find((x) => x.position === 1);
  return {
    results,
    winnerName: winner ? winner.driver : "",
    winnerTeam: winner ? winner.team : "",
    fastestLap: fastest ? `${fastest.code} ${fastest.time}` : "",
    laps: winner ? winner.laps : results[0] ? results[0].laps : 0,
  };
}

/** A season's constructors, calendar and both championship tables. */
async function fetchSeason(seasonArg) {
  const seg = !seasonArg || seasonArg === "current" ? "current" : String(seasonArg);

  const [ctorRes, raceRes, dStandRes, cStandRes] = await Promise.all([
    get(`${seg}/constructors.json?limit=100`),
    get(`${seg}.json?limit=100`),
    get(`${seg}/driverStandings.json?limit=100`),
    get(`${seg}/constructorStandings.json?limit=100`),
  ]);

  const dList = dStandRes.MRData.StandingsTable.StandingsLists[0];
  const cList = cStandRes.MRData.StandingsTable.StandingsLists[0];
  const season =
    parseInt(dList?.season) ||
    parseInt(raceRes.MRData.RaceTable.season) ||
    parseInt(seg);

  const constructors = ctorRes.MRData.ConstructorTable.Constructors || [];
  const races = raceRes.MRData.RaceTable.Races || [];
  const driverStandings = dList?.DriverStandings || [];
  const constructorStandings = cList?.ConstructorStandings || [];

  const now = new Date();
  const raceDocs = races.map((r) => ({
    name: r.raceName,
    circuit: r.Circuit.circuitName,
    circuitId: r.Circuit.circuitId,
    country: r.Circuit.Location.country,
    city: r.Circuit.Location.locality,
    date: new Date(`${r.date}T${r.time || "12:00:00Z"}`),
    season,
    round: parseInt(r.round),
    status: new Date(r.date) < now ? "completed" : "upcoming",
  }));

  return { season, constructors, races: raceDocs, driverStandings, constructorStandings };
}

/** Every race result a driver has ever recorded (paginated). */
async function fetchDriverResults(driverId) {
  const races = await getAllPages(`drivers/${driverId}/results.json`, (m) => m.RaceTable.Races);
  return races.map((race) => {
    const r = race.Results[0];
    return {
      season: parseInt(race.season),
      round: parseInt(race.round),
      positionText: r.positionText,
      points: parseFloat(r.points) || 0,
      constructorId: r.Constructor.constructorId,
      constructorName: r.Constructor.name,
    };
  });
}

/** One driver's final championship standing in one season (null if none). */
async function fetchDriverSeasonStanding(season, driverId) {
  const data = await get(`${season}/drivers/${driverId}/driverStandings.json`);
  const s = data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings?.[0];
  if (!s) return null;
  return {
    position: parseInt(s.position) || parseInt(s.positionText) || 0,
    points: parseFloat(s.points) || 0,
    wins: parseInt(s.wins) || 0,
    constructorId: s.Constructors.at(-1)?.constructorId || "",
    team: s.Constructors.at(-1)?.name || "",
  };
}

/** constructorId of a season's constructors' champion (null if none). */
async function fetchConstructorChampion(season) {
  const data = await get(`${season}/constructorStandings/1.json`);
  const c = data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings?.[0];
  return c ? c.Constructor.constructorId : null;
}

/** First season a constructor entered. */
async function fetchConstructorFirstSeason(constructorId) {
  const data = await get(`constructors/${constructorId}/seasons.json?limit=1`);
  return parseInt(data.MRData.SeasonTable.Seasons[0]?.season) || undefined;
}

/* ---- Season standings cache ---------------------------------------------------
   Career/title builds need "where did X finish in season Y" for many (X, Y).
   Seasons fetched earlier in the same run answer that for free; older seasons
   are answered from the Standing collection when it has ids, else the API. */

const _seasonTables = new Map(); // season -> { driverStandings, constructorStandings }

function rememberSeason(season, tables) {
  _seasonTables.set(season, tables);
}

async function driverSeasonStanding(season, driverId) {
  const cached = _seasonTables.get(season);
  if (cached) {
    const s = cached.driverStandings.find((x) => x.Driver.driverId === driverId);
    if (!s) return null;
    return {
      position: parseInt(s.position) || parseInt(s.positionText) || 0,
      points: parseFloat(s.points) || 0,
      wins: parseInt(s.wins) || 0,
      constructorId: s.Constructors.at(-1)?.constructorId || "",
      team: s.Constructors.at(-1)?.name || "",
    };
  }
  const doc = await Standing.findOne({ season, type: "driver", driverId }).lean();
  if (doc) {
    return { position: doc.position, points: doc.points, wins: doc.wins, team: doc.team };
  }
  return fetchDriverSeasonStanding(season, driverId);
}

async function constructorChampion(season) {
  const cached = _seasonTables.get(season);
  if (cached) {
    const c = cached.constructorStandings.find((x) => parseInt(x.position) === 1);
    return c ? c.Constructor.constructorId : null;
  }
  const doc = await Standing.findOne({
    season,
    type: "constructor",
    position: 1,
    constructorId: { $exists: true, $ne: "" },
  }).lean();
  if (doc) return doc.constructorId;
  return fetchConstructorChampion(season);
}

/* ---- Career builders -------------------------------------------------------- */

/**
 * A driver's full career from their real results: per-season history rows
 * (team, position, wins, podiums, points) plus totals. Titles count only
 * decided seasons — the in-progress one can't have a champion yet.
 */
async function buildDriverCareer(driverId) {
  const rows = await fetchDriverResults(driverId);
  const bySeason = new Map();
  for (const r of rows) {
    const agg = bySeason.get(r.season) || { wins: 0, podiums: 0, points: 0, team: "" };
    if (r.positionText === "1") agg.wins++;
    if (["1", "2", "3"].includes(r.positionText)) agg.podiums++;
    agg.points += r.points;
    agg.team = r.constructorName; // last constructor of the season wins
    bySeason.set(r.season, agg);
  }

  const history = [];
  for (const [year, agg] of [...bySeason].sort((a, b) => a[0] - b[0])) {
    const st = await driverSeasonStanding(year, driverId);
    history.push({
      year,
      team: st?.team || agg.team,
      position: st?.position || 0,
      wins: st?.wins ?? agg.wins,
      podiums: agg.podiums,
      // Championship points include sprints; race results alone don't.
      points: st ? st.points : agg.points,
    });
  }

  const years = history.map((h) => h.year);
  const first = Math.min(...years);
  const last = Math.max(...years);
  return {
    history,
    worldChampionships: history.filter((h) => h.position === 1 && h.year < CURRENT_YEAR).length,
    totalRaceWins: history.reduce((a, h) => a + h.wins, 0),
    totalPodiums: history.reduce((a, h) => a + h.podiums, 0),
    totalPoints: Math.round(history.reduce((a, h) => a + h.points, 0) * 100) / 100,
    seasonsActive: years.length
      ? `${first}–${last >= CURRENT_YEAR ? "present" : last}`
      : "",
  };
}

/** Constructors' titles (decided seasons only) and first entry year. */
async function buildTeamHistory(constructorId) {
  let worldChampionships = 0;
  for (let y = FIRST_CONSTRUCTOR_SEASON; y < CURRENT_YEAR; y++) {
    if ((await constructorChampion(y)) === constructorId) worldChampionships++;
  }
  const firstEntry = await fetchConstructorFirstSeason(constructorId);
  return { worldChampionships, firstEntry };
}

/* ---- Sync ---------------------------------------------------------------------- */

/**
 * Upserts one season into the current mongoose connection. Returns a summary.
 * Roster collections (Team / Driver / TeamStaff) model the CURRENT grid, so
 * they're only written when syncing the current season; historical seasons
 * write only the season-scoped Race / Standing / RaceHistory collections.
 */
async function syncSeason(
  seasonArg,
  { log = () => {}, prune = false, refresh = false, careers = true } = {},
) {
  const { season, constructors, races, driverStandings, constructorStandings } =
    await fetchSeason(seasonArg);
  rememberSeason(season, { driverStandings, constructorStandings });
  log(
    `Season ${season}: ${constructors.length} constructors, ${races.length} rounds, ${driverStandings.length} drivers`,
  );

  const isCurrent = season === CURRENT_YEAR;
  const summary = { season, teams: 0, drivers: 0, races: races.length, results: 0, standings: 0, staff: 0, pruned: {} };

  /* -- Current grid: teams, drivers, staff --------------------------------- */
  const teamIdByCtor = {};
  const teamIdByName = {};
  if (isCurrent) {
    for (const c of constructors) {
      const meta = TEAM_META[c.constructorId] || {};
      const principal = teamPrincipalFor(c.name);
      // Adopt a pre-existing doc by id, else by name (legacy seed data), else insert.
      const existing =
        (await Team.findOne({ constructorId: c.constructorId })) ||
        (await Team.findOne({ name: c.name }));
      const fields = {
        constructorId: c.constructorId,
        name: c.name,
        fullName: meta.fullName || c.name,
        color: colorFor(c.constructorId),
        ...(meta.base && { base: meta.base }),
        ...(meta.powerUnit && { powerUnit: meta.powerUnit }),
        ...(principal && { teamPrincipal: principal }),
      };
      let doc;
      if (existing) {
        doc = await Team.findByIdAndUpdate(existing._id, { $set: fields }, { new: true });
      } else {
        doc = await Team.create({
          base: "—",
          teamPrincipal: "—",
          powerUnit: "—",
          ...fields,
        });
      }
      teamIdByCtor[c.constructorId] = doc._id;
      teamIdByName[c.name] = doc._id;
      summary.teams++;
    }

    // Drivers — from the standings table (everyone who has raced this season).
    // A mid-season move lists several constructors; the last one is current.
    const driverIds = [];
    for (const s of driverStandings) {
      const d = s.Driver;
      const ctor = s.Constructors.at(-1);
      const teamId = ctor && teamIdByCtor[ctor.constructorId];
      if (!teamId) continue;
      driverIds.push(d.driverId);
      const existing =
        (await Driver.findOne({ driverId: d.driverId })) ||
        (await Driver.findOne({ firstName: d.givenName, lastName: d.familyName }));
      const fields = {
        driverId: d.driverId,
        code: d.code || d.familyName.slice(0, 3).toUpperCase(),
        firstName: d.givenName,
        lastName: d.familyName,
        number: parseInt(d.permanentNumber) || 0,
        nationality: d.nationality,
        dateOfBirth: d.dateOfBirth,
        team: teamId,
      };
      if (existing) await Driver.updateOne({ _id: existing._id }, { $set: fields });
      else await Driver.create(fields);
      summary.drivers++;
    }

    // Team staff (curated) keyed by API constructor name.
    for (const [teamName, members] of Object.entries(TEAM_STAFF)) {
      const teamId = teamIdByName[teamName];
      if (!teamId || !Array.isArray(members)) continue;
      for (const m of members) {
        await TeamStaff.findOneAndUpdate(
          { name: m.name, team: teamId },
          {
            $set: {
              role: m.role,
              department: m.department,
              team: teamId,
              teamName,
              nationality: m.nationality || "",
              experience: m.experience || "",
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
        summary.staff++;
      }
    }

    if (prune) {
      const teamIds = Object.values(teamIdByCtor);
      const ctorIds = Object.keys(teamIdByCtor);
      const t = await Team.deleteMany({ constructorId: { $nin: ctorIds } });
      const d = await Driver.deleteMany({
        $or: [{ driverId: { $nin: driverIds } }, { team: { $nin: teamIds } }],
      });
      const s = await TeamStaff.deleteMany({ team: { $nin: teamIds } });
      const window = { $lt: SEASON_FROM };
      const r = await Race.deleteMany({ season: window });
      const st = await Standing.deleteMany({ season: window });
      const h = await RaceHistory.deleteMany({ year: window });
      summary.pruned = {
        teams: t.deletedCount,
        drivers: d.deletedCount,
        staff: s.deletedCount,
        oldSeasonDocs: r.deletedCount + st.deletedCount + h.deletedCount,
      };
      log(`  · pruned`, summary.pruned);
    }
  }

  /* -- Calendar -------------------------------------------------------------- */
  for (const r of races) {
    await Race.updateOne({ season: r.season, round: r.round }, { $set: r }, { upsert: true });
  }
  // Rounds that vanished from the official calendar (renumbered/cancelled).
  await Race.deleteMany({ season, round: { $nin: races.map((r) => r.round) } });

  /* -- Real results for rounds that have been run ---------------------------- */
  const have = new Set(
    refresh
      ? []
      : (await Race.find({ season, "results.0": { $exists: true } }, { round: 1 }).lean()).map(
          (r) => r.round,
        ),
  );
  for (const r of races.filter((x) => x.status === "completed" && !have.has(x.round))) {
    const rr = await fetchRaceResults(season, r.round);
    if (!rr) continue;
    await Race.updateOne(
      { season, round: r.round },
      {
        $set: {
          results: rr.results,
          winnerName: rr.winnerName,
          winnerTeam: rr.winnerTeam,
          fastestLap: rr.fastestLap,
          laps: rr.laps,
          status: "completed",
        },
      },
    );
    summary.results++;
    log(`  · R${r.round} ${r.name}: ${rr.winnerName || "?"} won`);
  }

  /* -- Championship tables --------------------------------------------------- */
  const standingDocs = [
    ...driverStandings.map((s, i) => ({
      season,
      type: "driver",
      position: parseInt(s.position) || parseInt(s.positionText) || i + 1,
      driverId: s.Driver.driverId,
      name: fullName(s.Driver),
      team: s.Constructors.at(-1)?.name || "",
      constructorId: s.Constructors.at(-1)?.constructorId || "",
      nationality: s.Driver.nationality,
      points: parseFloat(s.points) || 0,
      wins: parseInt(s.wins) || 0,
    })),
    ...constructorStandings.map((s, i) => ({
      season,
      type: "constructor",
      position: parseInt(s.position) || parseInt(s.positionText) || i + 1,
      constructorId: s.Constructor.constructorId,
      name: s.Constructor.name,
      nationality: s.Constructor.nationality,
      points: parseFloat(s.points) || 0,
      wins: parseInt(s.wins) || 0,
    })),
  ];
  for (const s of standingDocs) {
    await Standing.updateOne(
      { season: s.season, type: s.type, position: s.position },
      { $set: s },
      { upsert: true },
    );
  }
  // Rows beyond this season's table length are leftovers from an older sync.
  await Standing.deleteMany({ season, type: "driver", position: { $gt: driverStandings.length } });
  await Standing.deleteMany({
    season,
    type: "constructor",
    position: { $gt: constructorStandings.length },
  });
  summary.standings = standingDocs.length;

  /* -- Season summary (Race History page) — decided seasons only ------------- */
  if (season < CURRENT_YEAR && driverStandings.length && constructorStandings.length) {
    const champ = driverStandings[0];
    const ctorChamp = constructorStandings[0];
    const teamWins = constructorStandings
      .filter((c) => parseInt(c.wins) > 0)
      .map((c) => ({
        team: c.Constructor.name,
        wins: parseInt(c.wins) || 0,
        color: colorFor(c.Constructor.constructorId),
      }));
    await RaceHistory.updateOne(
      { year: season },
      {
        $set: {
          year: season,
          totalRaces: races.length,
          champion: fullName(champ.Driver),
          championTeam: champ.Constructors.at(-1)?.name || "",
          constructorChampion: ctorChamp.Constructor.name,
          teamWins,
        },
      },
      { upsert: true },
    );
  }

  /* -- Careers + titles (current grid only) ---------------------------------- */
  if (isCurrent && careers) {
    log(`  · building ${driverStandings.length} driver careers from real results…`);
    for (const s of driverStandings) {
      const d = s.Driver;
      const career = await buildDriverCareer(d.driverId);
      await Driver.updateOne({ driverId: d.driverId }, { $set: career });
      log(
        `    ${fullName(d)}: ${career.history.length} seasons, ${career.totalRaceWins} wins, ${career.totalPodiums} podiums, ${career.worldChampionships} titles`,
      );
    }
    log(`  · constructor titles + first entries…`);
    for (const c of constructors) {
      const hist = await buildTeamHistory(c.constructorId);
      await Team.updateOne({ constructorId: c.constructorId }, { $set: hist });
      log(`    ${c.name}: ${hist.worldChampionships} titles, since ${hist.firstEntry}`);
    }
  }

  return summary;
}

/**
 * Syncs an inclusive range of seasons OLDEST → NEWEST, so the current season
 * (which writes the roster) is applied last and its standings caches are warm
 * for the career build.
 */
async function syncRange(from, to, opts = {}) {
  const { log = () => {} } = opts;
  const summaries = [];
  for (let year = from; year <= to; year++) {
    log(`\n──────── ${year} ────────`);
    try {
      const s = await syncSeason(String(year), opts);
      log(`✅ ${year}:`, s);
      summaries.push(s);
    } catch (err) {
      log(`⚠️  ${year} failed: ${err.message}`);
    }
  }
  return summaries;
}

/* ---- CLI ------------------------------------------------------------------------ */

function parseArgs(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const rangeArg = argv.find((a) => /^\d{4}-\d{4}$/.test(a));
  const seasonArg = argv.find((a) => a === "current" || /^\d{4}$/.test(a));
  let range = null;
  if (flags.has("--all")) range = [SEASON_FROM, CURRENT_YEAR];
  else if (rangeArg) range = rangeArg.split("-").map(Number);
  return {
    range,
    season: seasonArg || "current",
    prune: flags.has("--prune"),
    refresh: flags.has("--refresh"),
    careers: !flags.has("--no-careers"),
    dryRun: flags.has("--dry-run"),
  };
}

async function main() {
  const { range, season, prune, refresh, careers, dryRun } = parseArgs(process.argv.slice(2));
  const started = Date.now();
  const elapsed = () => `${Math.round((Date.now() - started) / 1000)}s, ${requestCount} requests`;

  if (dryRun) {
    const data = await fetchSeason(season);
    console.log(`\nDRY RUN — season ${data.season}`);
    console.log(`  ${data.constructors.length} constructors: ${data.constructors.map((c) => c.name).join(", ")}`);
    console.log(`  ${data.races.length} rounds (${data.races.filter((r) => r.status === "completed").length} run)`);
    console.log(`  ${data.driverStandings.length} drivers; leader ${data.driverStandings[0] ? fullName(data.driverStandings[0].Driver) : "—"} ${data.driverStandings[0]?.points ?? ""}pts`);
    console.log(`\n✅ Dry run complete — nothing written (${elapsed()}).\n`);
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const opts = { log: console.log, prune, refresh, careers };
  try {
    if (range) {
      const [from, to] = range;
      console.log(`\n🔄 Syncing seasons ${from}–${to} from Jolpica${prune ? " (with prune)" : ""}\n`);
      const summaries = await syncRange(from, to, opts);
      const totals = summaries.reduce(
        (a, s) => ({ seasons: a.seasons + 1, races: a.races + s.races, results: a.results + s.results }),
        { seasons: 0, races: 0, results: 0 },
      );
      const failed = to - from + 1 - summaries.length;
      console.log(`\n✅ Range sync complete (${elapsed()}):`, totals, failed ? `— ${failed} season(s) FAILED, re-run them` : "", "\n");
      if (failed) process.exitCode = 1;
    } else {
      console.log(`\n🔄 Syncing "${season}" from Jolpica${prune ? " (with prune)" : ""}\n`);
      const summary = await syncSeason(season, opts);
      console.log(`\n✅ Sync complete (${elapsed()}):`, summary, "\n");
    }
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("\n❌ Sync failed:", err.message);
    process.exit(1);
  });
}

module.exports = {
  API,
  CURRENT_YEAR,
  SEASON_FROM,
  HISTORY_YEARS,
  get,
  fetchSeason,
  fetchRaceResults,
  syncSeason,
  syncRange,
  TEAM_STAFF,
  TEAM_COLORS,
};
