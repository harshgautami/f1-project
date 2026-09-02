/* ---------------------------------------------------------------------------
   Data verification.

   Checks that the database holds one clean, real copy of the F1 data:
     · roster integrity — one team per constructor on the current grid, one
       driver per driverId, no duplicates, no orphan drivers/staff, no
       placeholder team facts
     · every season in the history window has a calendar, championship tables
       and results for every round that has been run
     · nothing outside the window, no stale rounds/positions
     · cross-checks against the live API: round counts, result-row counts,
       championship leaders, and a few well-known anchors (2016 Rosberg, 2021
       Mercedes constructors, 2024 McLaren constructors) — skipped with
       --offline

   Usage (from backend/): node scripts/verify.js [--offline]
   Exit code 1 if any check fails.
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
const { get, SEASON_FROM, CURRENT_YEAR } = require("./sync");

const offline = process.argv.includes("--offline");
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};

// Known outcomes used to sanity-check the API itself, not just our copy of it.
const ANCHORS = [
  { year: 2016, champion: "Nico Rosberg", constructor: "Mercedes" },
  { year: 2021, champion: "Max Verstappen", constructor: "Mercedes" },
  { year: 2024, champion: "Max Verstappen", constructor: "McLaren" },
];

async function verifyRoster() {
  console.log("\n── Current grid ──");
  const teams = await Team.find().lean();
  const drivers = await Driver.find().lean();
  const staff = await TeamStaff.find().lean();

  const noCtorId = teams.filter((t) => !t.constructorId);
  check("every team carries a Jolpica constructorId", noCtorId.length === 0, noCtorId.map((t) => t.name).join(", "));
  const ctorIds = teams.map((t) => t.constructorId);
  check("no duplicate constructors", new Set(ctorIds).size === ctorIds.length);
  const placeholders = teams.filter((t) => [t.base, t.teamPrincipal, t.powerUnit].includes("—"));
  check("no placeholder team facts (base / principal / power unit)", placeholders.length === 0, placeholders.map((t) => t.name).join(", "));
  check("every team has a first-entry year", teams.every((t) => Number.isInteger(t.firstEntry)));

  const noDriverId = drivers.filter((d) => !d.driverId);
  check("every driver carries a Jolpica driverId", noDriverId.length === 0, noDriverId.map((d) => `${d.firstName} ${d.lastName}`).join(", "));
  const ids = drivers.map((d) => d.driverId);
  check("no duplicate drivers", new Set(ids).size === ids.length);
  const names = drivers.map((d) => `${d.firstName} ${d.lastName}`.toLowerCase());
  check("no duplicate driver names", new Set(names).size === names.length);
  const teamIds = new Set(teams.map((t) => String(t._id)));
  const orphanDrivers = drivers.filter((d) => !teamIds.has(String(d.team)));
  check("every driver belongs to a current team", orphanDrivers.length === 0, orphanDrivers.map((d) => d.lastName).join(", "));
  const orphanStaff = staff.filter((s) => !teamIds.has(String(s.team)));
  check("every staff member belongs to a current team", orphanStaff.length === 0, `${orphanStaff.length} orphaned`);
  const staffKeys = staff.map((s) => `${s.name}|${s.team}`);
  check("no duplicate staff", new Set(staffKeys).size === staffKeys.length);
  const noCareer = drivers.filter((d) => !Array.isArray(d.history) || !d.history.length);
  check("every driver has a real career history", noCareer.length === 0, noCareer.map((d) => d.lastName).join(", "));
  const badTotals = drivers.filter(
    (d) => d.totalRaceWins > d.totalPodiums || d.history.reduce((a, h) => a + h.wins, 0) !== d.totalRaceWins,
  );
  check("career totals are consistent with season history", badTotals.length === 0, badTotals.map((d) => d.lastName).join(", "));

  // The current championship table is the authority on who's on the grid.
  const table = await Standing.find({ season: CURRENT_YEAR, type: "driver" }).lean();
  check(
    `driver count matches the ${CURRENT_YEAR} championship table`,
    table.length > 0 && drivers.length === table.length,
    `${drivers.length} drivers vs ${table.length} classified`,
  );
  const ctorTable = await Standing.find({ season: CURRENT_YEAR, type: "constructor" }).lean();
  check(
    `team count matches the ${CURRENT_YEAR} constructors' table`,
    ctorTable.length > 0 && teams.length === ctorTable.length,
    `${teams.length} teams vs ${ctorTable.length} classified`,
  );
  return { teams, drivers };
}

async function verifySeasons() {
  console.log(`\n── Seasons ${SEASON_FROM}–${CURRENT_YEAR} ──`);
  const outside = await Race.countDocuments({ season: { $lt: SEASON_FROM } })
    + (await Standing.countDocuments({ season: { $lt: SEASON_FROM } }))
    + (await RaceHistory.countDocuments({ year: { $lt: SEASON_FROM } }));
  check("no data outside the history window", outside === 0, `${outside} stray docs`);

  const perSeason = [];
  for (let y = SEASON_FROM; y <= CURRENT_YEAR; y++) {
    const races = await Race.find({ season: y }).sort({ round: 1 }).lean();
    const dTable = await Standing.find({ season: y, type: "driver" }).sort({ position: 1 }).lean();
    const cTable = await Standing.find({ season: y, type: "constructor" }).sort({ position: 1 }).lean();
    const hist = await RaceHistory.findOne({ year: y }).lean();
    const rounds = races.map((r) => r.round);
    const contiguous = rounds.every((r, i) => r === i + 1);
    const run = races.filter((r) => new Date(r.date) < new Date());
    const withResults = races.filter((r) => r.results && r.results.length);
    const resultRows = withResults.reduce((a, r) => a + r.results.length, 0);
    const positionsOk =
      dTable.every((s, i) => s.position === i + 1) && cTable.every((s, i) => s.position === i + 1);
    const ok =
      races.length > 0 &&
      contiguous &&
      dTable.length > 0 &&
      cTable.length > 0 &&
      positionsOk &&
      (y === CURRENT_YEAR || !!hist);
    check(
      `${y}: ${races.length} rounds, ${withResults.length}/${run.length} run rounds have results, ${dTable.length} drivers / ${cTable.length} teams classified${hist ? `, champion ${hist.champion}` : ""}`,
      ok,
      !contiguous ? "rounds not contiguous" : !positionsOk ? "standings positions have gaps" : "",
    );
    perSeason.push({ y, rounds: races.length, run: run.length, withResults: withResults.length, resultRows, dTable, cTable, hist });
  }
  return perSeason;
}

async function verifyAgainstApi(perSeason, roster) {
  console.log("\n── Cross-check against the live Jolpica API ──");
  for (const s of perSeason) {
    const cal = await get(`${s.y}.json?limit=100`);
    const apiRounds = cal.MRData.RaceTable.Races.length;
    const res = await get(`${s.y}/results.json?limit=1`);
    const apiRows = parseInt(res.MRData.total) || 0;
    const st = await get(`${s.y}/driverStandings.json?limit=1`);
    const leader = st.MRData.StandingsTable.StandingsLists[0]?.DriverStandings?.[0];
    const leaderName = leader ? `${leader.Driver.givenName} ${leader.Driver.familyName}` : "";
    const ours = s.dTable[0]?.name || "";
    check(
      `${s.y}: rounds ${s.rounds}/${apiRounds}, result rows ${s.resultRows}/${apiRows}, leader ${ours}`,
      s.rounds === apiRounds && s.resultRows === apiRows && ours === leaderName,
      ours !== leaderName ? `API says ${leaderName}` : "",
    );
  }

  for (const a of ANCHORS) {
    const s = perSeason.find((x) => x.y === a.year);
    if (!s) continue;
    check(
      `anchor ${a.year}: ${a.champion} / ${a.constructor}`,
      s.hist && s.hist.champion === a.champion && s.hist.constructorChampion === a.constructor,
      s.hist ? `${s.hist.champion} / ${s.hist.constructorChampion}` : "no history doc",
    );
  }

  // Career totals vs the API's own counts for the three most-winning drivers.
  const top = [...roster.drivers].sort((a, b) => b.totalRaceWins - a.totalRaceWins).slice(0, 3);
  for (const d of top) {
    const wins = parseInt((await get(`drivers/${d.driverId}/results/1.json?limit=1`)).MRData.total) || 0;
    check(`${d.firstName} ${d.lastName}: ${d.totalRaceWins} wins`, d.totalRaceWins === wins, wins !== d.totalRaceWins ? `API says ${wins}` : "");
  }
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const roster = await verifyRoster();
    const perSeason = await verifySeasons();
    if (!offline) await verifyAgainstApi(perSeason, roster);
  } finally {
    await mongoose.disconnect();
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${failed.length ? "❌" : "✅"} ${results.length - failed.length}/${results.length} checks passed${offline ? " (offline)" : ""}`);
  if (failed.length) {
    console.log("Failed:\n" + failed.map((f) => `  · ${f.name}${f.detail ? ` — ${f.detail}` : ""}`).join("\n"));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
