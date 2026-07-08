/* ---------------------------------------------------------------------------
   Live F1 data sync.

   Pulls a season's constructors, drivers, race calendar and standings from the
   Jolpica-F1 API (the maintained drop-in successor to Ergast) and UPSERTS them
   into MongoDB. Unlike the seed script this is NON-destructive: it updates
   existing documents and inserts new ones, never wiping collections.

   Usage:
     node scripts/sync.js [season] [--dry-run]

     node scripts/sync.js              # sync the default season
     node scripts/sync.js 2023         # sync a specific season
     node scripts/sync.js 2024 --dry-run   # fetch + map + report, no DB writes

   Requires Node 18+ (global fetch).
   --------------------------------------------------------------------------- */

const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Team = require("../models/Team");
const Driver = require("../models/Driver");
const Race = require("../models/Race");
const Standing = require("../models/Standing");

const API = "https://api.jolpi.ca/ergast/f1";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const season = parseInt(args.find((a) => /^\d{4}$/.test(a))) || 2024;

// Ergast/Jolpica doesn't supply team colours; map the well-known ones.
const TEAM_COLORS = {
  red_bull: "#3671C6",
  ferrari: "#E8002D",
  mercedes: "#27F4D2",
  mclaren: "#FF8000",
  aston_martin: "#229971",
  alpine: "#0093CC",
  williams: "#64C4FF",
  rb: "#6692FF",
  sauber: "#52E252",
  haas: "#B6BABD",
};

async function get(pathname) {
  const url = `${API}/${pathname}`;
  const res = await fetch(url, { headers: { "User-Agent": "f1-management-sync" } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

async function run() {
  console.log(`\n🔄 Syncing ${season} from Jolpica (${dryRun ? "DRY RUN" : "writing to DB"})\n`);

  // --- Fetch everything first (so a dry run needs no DB) ---
  const [ctorRes, raceRes, dStandRes, cStandRes] = await Promise.all([
    get(`${season}/constructors.json?limit=100`),
    get(`${season}.json?limit=100`),
    get(`${season}/driverStandings.json?limit=100`),
    get(`${season}/constructorStandings.json?limit=100`),
  ]);

  const constructors = ctorRes.MRData.ConstructorTable.Constructors || [];
  const races = raceRes.MRData.RaceTable.Races || [];
  const driverStandings =
    dStandRes.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
  const constructorStandings =
    cStandRes.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];

  const teamDocs = constructors.map((c) => ({
    id: c.constructorId,
    name: c.name,
    fullName: c.name,
    color: TEAM_COLORS[c.constructorId] || "#e10600",
  }));

  const now = new Date();
  const raceDocs = races.map((r) => ({
    name: r.raceName,
    circuit: r.Circuit.circuitName,
    country: r.Circuit.Location.country,
    city: r.Circuit.Location.locality,
    date: new Date(`${r.date}T${r.time || "12:00:00Z"}`),
    season,
    round: parseInt(r.round),
    status: new Date(r.date) < now ? "completed" : "upcoming",
  }));

  const driverStandingDocs = driverStandings.map((s) => ({
    season,
    type: "driver",
    position: parseInt(s.position),
    name: `${s.Driver.givenName} ${s.Driver.familyName}`,
    team: s.Constructors[0]?.name || "",
    nationality: s.Driver.nationality,
    points: parseFloat(s.points),
    wins: parseInt(s.wins),
  }));

  const constructorStandingDocs = constructorStandings.map((s) => ({
    season,
    type: "constructor",
    position: parseInt(s.position),
    name: s.Constructor.name,
    nationality: s.Constructor.nationality,
    points: parseFloat(s.points),
    wins: parseInt(s.wins),
  }));

  console.log(
    `Fetched: ${teamDocs.length} teams, ${races.length} races, ` +
      `${driverStandings.length} driver standings, ${constructorStandings.length} constructor standings`,
  );

  if (dryRun) {
    console.log("\n--- sample team ---", teamDocs[0]);
    console.log("--- sample race ---", raceDocs[0]);
    console.log("--- sample driver standing ---", driverStandingDocs[0]);
    console.log("\n✅ Dry run complete — no data written.\n");
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB\n");

  // --- Teams (upsert by name; keep required placeholders on first insert) ---
  const teamIdByCtorName = {};
  for (const t of teamDocs) {
    const doc = await Team.findOneAndUpdate(
      { name: t.name },
      {
        $set: { fullName: t.fullName, color: t.color },
        $setOnInsert: { base: "—", teamPrincipal: "—", powerUnit: "—" },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    teamIdByCtorName[t.name] = doc._id;
  }
  console.log(`✓ Teams upserted: ${teamDocs.length}`);

  // --- Drivers (from standings, so we can resolve their constructor) ---
  let driverCount = 0;
  for (const s of driverStandings) {
    const d = s.Driver;
    const teamName = s.Constructors[0]?.name;
    const teamId = teamName ? teamIdByCtorName[teamName] : undefined;
    if (!teamId) continue; // Driver model requires a team ref
    await Driver.findOneAndUpdate(
      { firstName: d.givenName, lastName: d.familyName },
      {
        $set: {
          number: parseInt(d.permanentNumber) || 0,
          nationality: d.nationality,
          dateOfBirth: d.dateOfBirth,
          team: teamId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    driverCount++;
  }
  console.log(`✓ Drivers upserted: ${driverCount}`);

  // --- Races (upsert by season + round) ---
  for (const r of raceDocs) {
    await Race.updateOne(
      { season: r.season, round: r.round },
      { $set: r },
      { upsert: true },
    );
  }
  console.log(`✓ Races upserted: ${raceDocs.length}`);

  // --- Standings (upsert by season + type + position) ---
  for (const s of [...driverStandingDocs, ...constructorStandingDocs]) {
    await Standing.updateOne(
      { season: s.season, type: s.type, position: s.position },
      { $set: s },
      { upsert: true },
    );
  }
  console.log(
    `✓ Standings upserted: ${driverStandingDocs.length + constructorStandingDocs.length}`,
  );

  await mongoose.disconnect();
  console.log("\n✅ Sync complete.\n");
}

run().catch((err) => {
  console.error("\n❌ Sync failed:", err.message);
  process.exit(1);
});
