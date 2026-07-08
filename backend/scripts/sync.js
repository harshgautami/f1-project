/* ---------------------------------------------------------------------------
   Live F1 data sync.

   Pulls the current (or a given) season's constructors, drivers, race calendar
   and standings from the Jolpica-F1 API (the maintained successor to Ergast)
   and UPSERTS them into MongoDB — non-destructive, unlike the seed script. Team
   staff isn't available from any results API, so a curated current-season roster
   (TEAM_STAFF below) is upserted alongside.

   Usage:
     node scripts/sync.js                # sync the CURRENT season
     node scripts/sync.js 2024           # a specific season
     node scripts/sync.js current --dry-run

   Exposes syncSeason() for programmatic use (assumes mongoose is already
   connected). Requires Node 18+ (global fetch).
   --------------------------------------------------------------------------- */

const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Team = require("../models/Team");
const Driver = require("../models/Driver");
const Race = require("../models/Race");
const Standing = require("../models/Standing");
const TeamStaff = require("../models/TeamStaff");

const API = "https://api.jolpi.ca/ergast/f1";

// Ergast/Jolpica doesn't supply team colours; map by constructorId.
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
  audi: "#00D5B8",
  haas: "#B6BABD",
  cadillac: "#C69A5A",
};

// Curated current-season staff keyed by the API constructor NAME. Populated
// from research; safe to extend. Empty entries are simply skipped.
const TEAM_STAFF = {
  "Red Bull": [
    {
      "name": "Laurent Mekies",
      "role": "Team Principal & CEO",
      "department": "management",
      "nationality": "French",
      "experience": "20+ years in motorsport; RBR TP since July 2025"
    },
    {
      "name": "Pierre Wache",
      "role": "Technical Director",
      "department": "mechanical",
      "nationality": "French",
      "experience": "With Red Bull since 2013"
    },
    {
      "name": "Ben Waterhouse",
      "role": "Chief Performance and Design Engineer",
      "department": "mechanical",
      "nationality": "British",
      "experience": ""
    },
    {
      "name": "Andrea Landi",
      "role": "Head of Performance",
      "department": "aerodynamics",
      "nationality": "Italian",
      "experience": "Ex-Ferrari Deputy Head of Vehicle Performance; joined July 2026"
    },
    {
      "name": "Gianpiero Lambiase",
      "role": "Head of Race Engineering / Race Engineer (Verstappen)",
      "department": "strategy",
      "nationality": "British",
      "experience": "10+ years engineering Verstappen"
    },
    {
      "name": "Richard Wood",
      "role": "Race Engineer (Hadjar)",
      "department": "strategy",
      "nationality": "British",
      "experience": "At Red Bull since 2012"
    }
  ],
  "Ferrari": [
    {
      "name": "Frederic Vasseur",
      "role": "Team Principal",
      "department": "management",
      "nationality": "French",
      "experience": "Ferrari TP since 2023"
    },
    {
      "name": "Jerome D'Ambrosio",
      "role": "Deputy Team Principal",
      "department": "management",
      "nationality": "Belgian",
      "experience": ""
    },
    {
      "name": "Loic Serra",
      "role": "Technical Director (Chassis)",
      "department": "mechanical",
      "nationality": "French",
      "experience": "Joined from Mercedes"
    },
    {
      "name": "Diego Tondi",
      "role": "Head of Aerodynamics",
      "department": "aerodynamics",
      "nationality": "Italian",
      "experience": ""
    },
    {
      "name": "Fabio Montecchi",
      "role": "Chief Project Engineer",
      "department": "mechanical",
      "nationality": "Italian",
      "experience": ""
    },
    {
      "name": "Bryan Bozzi",
      "role": "Race Engineer (Leclerc)",
      "department": "strategy",
      "nationality": "Italian",
      "experience": "Leclerc's engineer since 2024"
    }
  ],
  "Mercedes": [
    {
      "name": "Toto Wolff",
      "role": "Team Principal & CEO",
      "department": "management",
      "nationality": "Austrian",
      "experience": "Mercedes TP since 2013"
    },
    {
      "name": "James Allison",
      "role": "Technical Director",
      "department": "mechanical",
      "nationality": "British",
      "experience": "30+ years in F1"
    },
    {
      "name": "Andrew Shovlin",
      "role": "Trackside Engineering Director",
      "department": "strategy",
      "nationality": "British",
      "experience": ""
    },
    {
      "name": "Peter Bonnington",
      "role": "Head of Race Engineering / Race Engineer (Antonelli)",
      "department": "strategy",
      "nationality": "British",
      "experience": "Six titles engineering Hamilton"
    },
    {
      "name": "Marcus Dudley",
      "role": "Race Engineer (Russell)",
      "department": "strategy",
      "nationality": "British",
      "experience": "Russell's engineer since 2023"
    },
    {
      "name": "Matt Deane",
      "role": "Chief Mechanic",
      "department": "pitstop",
      "nationality": "British",
      "experience": ""
    }
  ],
  "McLaren": [
    {
      "name": "Andrea Stella",
      "role": "Team Principal",
      "department": "management",
      "nationality": "Italian",
      "experience": "20+ years in F1; 2024 & 2025 Constructors' title-winning boss"
    },
    {
      "name": "Peter Prodromou",
      "role": "Technical Director, Aerodynamics",
      "department": "aerodynamics",
      "nationality": "British",
      "experience": "30+ years in F1 aero"
    },
    {
      "name": "Neil Houldey",
      "role": "Technical Director, Engineering",
      "department": "mechanical",
      "nationality": "British",
      "experience": ""
    },
    {
      "name": "Rob Marshall",
      "role": "Chief Designer",
      "department": "mechanical",
      "nationality": "British",
      "experience": "Ex-Red Bull chief engineering officer"
    },
    {
      "name": "Will Joseph",
      "role": "Race Engineer (Lando Norris) / Director of Race Engineering",
      "department": "strategy",
      "nationality": "British",
      "experience": "20 years at McLaren"
    },
    {
      "name": "Tom Stallard",
      "role": "Race Engineer (Oscar Piastri)",
      "department": "strategy",
      "nationality": "British",
      "experience": "Long-serving McLaren race engineer; 2008 Olympic rowing silver medallist"
    },
    {
      "name": "Piers Thynne",
      "role": "Chief Operating Officer",
      "department": "management",
      "nationality": "British",
      "experience": ""
    }
  ],
  "Aston Martin": [
    {
      "name": "Adrian Newey",
      "role": "Team Principal / Managing Technical Partner",
      "department": "management",
      "nationality": "British",
      "experience": "Most successful car designer in F1 history"
    },
    {
      "name": "Enrico Cardile",
      "role": "Chief Technical Officer",
      "department": "mechanical",
      "nationality": "Italian",
      "experience": "Former Ferrari technical director; joined July 2025"
    },
    {
      "name": "Andy Cowell",
      "role": "Chief Strategy Officer",
      "department": "strategy",
      "nationality": "British",
      "experience": "Ex-Mercedes HPP MD; former team principal/CEO"
    },
    {
      "name": "Chris Cronin",
      "role": "Senior Race Engineer (Fernando Alonso)",
      "department": "strategy",
      "nationality": "British",
      "experience": ""
    },
    {
      "name": "Gary Gannon",
      "role": "Race Engineer (Lance Stroll)",
      "department": "strategy",
      "nationality": "British",
      "experience": ""
    },
    {
      "name": "Lawrence Stroll",
      "role": "Executive Chairman / Owner",
      "department": "management",
      "nationality": "Canadian",
      "experience": ""
    }
  ],
  "Alpine F1 Team": [
    {
      "name": "Flavio Briatore",
      "role": "Executive Advisor (de facto team boss)",
      "department": "management",
      "nationality": "Italian",
      "experience": "Former championship-winning Benetton/Renault boss"
    },
    {
      "name": "Steve Nielsen",
      "role": "Managing Director",
      "department": "management",
      "nationality": "British",
      "experience": "Ex-F1/FIA sporting director; former Enstone sporting director"
    },
    {
      "name": "David Sanchez",
      "role": "Executive Technical Director",
      "department": "mechanical",
      "nationality": "French",
      "experience": "Former Ferrari and McLaren senior technical figure"
    },
    {
      "name": "David Wheater",
      "role": "Technical Director, Aerodynamics",
      "department": "aerodynamics",
      "nationality": "British",
      "experience": ""
    },
    {
      "name": "Josh Peckett",
      "role": "Race Engineer (Pierre Gasly)",
      "department": "strategy",
      "nationality": "British",
      "experience": ""
    },
    {
      "name": "Stuart Barlow",
      "role": "Race Engineer (Franco Colapinto)",
      "department": "strategy",
      "nationality": "British",
      "experience": ""
    }
  ],
  "Williams": [
    {
      "name": "James Vowles",
      "role": "Team Principal",
      "department": "management",
      "nationality": "British",
      "experience": "20+ years in F1 (ex-Mercedes Motorsport Strategy Director)"
    },
    {
      "name": "Pat Fry",
      "role": "Chief Technical Officer",
      "department": "mechanical",
      "nationality": "British",
      "experience": "30+ years in F1 (McLaren, Ferrari, Alpine)"
    },
    {
      "name": "Adam Kenyon",
      "role": "Head of Aerodynamics",
      "department": "aerodynamics",
      "nationality": "British",
      "experience": "Ex-Red Bull and Mercedes aerodynamicist"
    },
    {
      "name": "Sven Smeets",
      "role": "Sporting Director",
      "department": "management",
      "nationality": "Belgian",
      "experience": "At Williams since 2021"
    },
    {
      "name": "Dave Robson",
      "role": "Head of Vehicle Performance",
      "department": "strategy",
      "nationality": "British",
      "experience": "Long-serving Williams senior engineer"
    },
    {
      "name": "Gaetan Jego",
      "role": "Race Engineer (Carlos Sainz)",
      "department": "strategy",
      "nationality": "French",
      "experience": ""
    },
    {
      "name": "James Urwin",
      "role": "Race Engineer (Alex Albon)",
      "department": "strategy",
      "nationality": "British",
      "experience": ""
    }
  ],
  "RB F1 Team": [
    {
      "name": "Alan Permane",
      "role": "Team Principal",
      "department": "management",
      "nationality": "British",
      "experience": "30+ years in F1 (ex-Renault/Alpine Sporting Director)"
    },
    {
      "name": "Tim Goss",
      "role": "Chief Technical Officer",
      "department": "mechanical",
      "nationality": "British",
      "experience": "Ex-McLaren and FIA technical director"
    },
    {
      "name": "Guillaume Cattelani",
      "role": "Deputy Technical Director (Performance)",
      "department": "mechanical",
      "nationality": "French",
      "experience": ""
    },
    {
      "name": "Andrea Landi",
      "role": "Deputy Technical Director",
      "department": "mechanical",
      "nationality": "Italian",
      "experience": ""
    },
    {
      "name": "Alexandre Iliopoulos",
      "role": "Race Engineer (Liam Lawson)",
      "department": "strategy",
      "nationality": "",
      "experience": ""
    }
  ],
  "Haas F1 Team": [
    {
      "name": "Ayao Komatsu",
      "role": "Team Principal",
      "department": "management",
      "nationality": "Japanese",
      "experience": "20+ years in F1; TP since 2024"
    },
    {
      "name": "Andrea De Zordo",
      "role": "Technical Director",
      "department": "mechanical",
      "nationality": "Italian",
      "experience": ""
    },
    {
      "name": "Mark Lowe",
      "role": "Sporting Director",
      "department": "management",
      "nationality": "British",
      "experience": ""
    },
    {
      "name": "Laura Mueller",
      "role": "Race Engineer (Esteban Ocon)",
      "department": "strategy",
      "nationality": "German",
      "experience": "First female F1 race engineer (2025)"
    },
    {
      "name": "Ronan O'Hare",
      "role": "Race Engineer (Oliver Bearman)",
      "department": "strategy",
      "nationality": "British",
      "experience": ""
    }
  ],
  "Audi": [
    {
      "name": "Mattia Binotto",
      "role": "Team Principal / Head of F1 Project (COO & CTO)",
      "department": "management",
      "nationality": "Italian",
      "experience": "30+ years in F1 (ex-Ferrari Team Principal)"
    },
    {
      "name": "James Key",
      "role": "Technical Director (Chassis)",
      "department": "mechanical",
      "nationality": "British",
      "experience": "25+ years in F1"
    },
    {
      "name": "Stefan Dreyer",
      "role": "Chief Technical Officer, Power Unit",
      "department": "mechanical",
      "nationality": "German",
      "experience": ""
    },
    {
      "name": "Alessandro Cinelli",
      "role": "Head of Aerodynamics",
      "department": "aerodynamics",
      "nationality": "Italian",
      "experience": ""
    },
    {
      "name": "Giampaolo Dall'Ara",
      "role": "Head of Race Engineering",
      "department": "strategy",
      "nationality": "Italian",
      "experience": "20+ years at Sauber"
    },
    {
      "name": "Iñaki Rueda",
      "role": "Sporting Director",
      "department": "management",
      "nationality": "Spanish",
      "experience": "ex-Ferrari Head of Race Strategy"
    },
    {
      "name": "Stefano Sordo",
      "role": "Performance Director",
      "department": "strategy",
      "nationality": "Italian",
      "experience": ""
    }
  ],
  "Cadillac F1 Team": [
    {
      "name": "Graeme Lowdon",
      "role": "Team Principal",
      "department": "management",
      "nationality": "British",
      "experience": "ex-Virgin/Marussia F1"
    },
    {
      "name": "Nick Chester",
      "role": "Technical Director",
      "department": "mechanical",
      "nationality": "British",
      "experience": "25+ years (ex-Enstone/Renault)"
    },
    {
      "name": "Pat Symonds",
      "role": "Chief Technical Officer",
      "department": "mechanical",
      "nationality": "British",
      "experience": "40+ years in F1"
    },
    {
      "name": "Rob White",
      "role": "Chief Operating Officer",
      "department": "management",
      "nationality": "British",
      "experience": "ex-Renault power unit"
    },
    {
      "name": "Xavi Marcos",
      "role": "Chief Race Engineer",
      "department": "strategy",
      "nationality": "Spanish",
      "experience": "ex-Ferrari race engineer"
    },
    {
      "name": "Jon Tomlinson",
      "role": "Head of Aerodynamics",
      "department": "aerodynamics",
      "nationality": "British",
      "experience": "ex-Enstone aerodynamicist"
    },
    {
      "name": "Naoki Tokunaga",
      "role": "Technical Advisor",
      "department": "management",
      "nationality": "Japanese",
      "experience": ""
    }
  ]
};

async function get(pathname) {
  const url = `${API}/${pathname}`;
  const res = await fetch(url, { headers: { "User-Agent": "f1-management-sync" } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

/**
 * Fetches + maps a season's data. Returns the mapped docs. Pure (no DB writes),
 * so it can back a dry run.
 */
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

  const teams = constructors.map((c) => ({
    constructorId: c.constructorId,
    name: c.name,
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

  return { season, teams, races: raceDocs, driverStandings, constructorStandings };
}

/**
 * Upserts a season into the current mongoose connection. Assumes an active
 * connection (the CLI/runner establishes it).
 */
async function syncSeason(seasonArg, { log = () => {} } = {}) {
  const { season, teams, races, driverStandings, constructorStandings } =
    await fetchSeason(seasonArg);
  log(`Season ${season}: ${teams.length} teams, ${races.length} races, ${driverStandings.length} drivers`);

  // Teams — keep required placeholders only on first insert.
  const teamIdByName = {};
  for (const t of teams) {
    const doc = await Team.findOneAndUpdate(
      { name: t.name },
      {
        $set: { fullName: t.name, color: t.color },
        $setOnInsert: { base: "—", teamPrincipal: "—", powerUnit: "—" },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    teamIdByName[t.name] = doc._id;
  }

  // Drivers — sourced from standings so we can resolve their constructor.
  let driverCount = 0;
  for (const s of driverStandings) {
    const d = s.Driver;
    const teamName = s.Constructors[0]?.name;
    const teamId = teamName ? teamIdByName[teamName] : undefined;
    if (!teamId) continue;
    await Driver.findOneAndUpdate(
      { firstName: d.givenName, lastName: d.familyName },
      {
        $set: {
          number: parseInt(d.permanentNumber) || 0,
          nationality: d.nationality,
          dateOfBirth: d.dateOfBirth,
          team: teamId,
          totalPoints: parseFloat(s.points) || 0,
          totalRaceWins: parseInt(s.wins) || 0,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    driverCount++;
  }

  // Races.
  for (const r of races) {
    await Race.updateOne({ season: r.season, round: r.round }, { $set: r }, { upsert: true });
  }

  // Standings.
  const standingDocs = [
    ...driverStandings.map((s) => ({
      season,
      type: "driver",
      position: parseInt(s.position),
      name: `${s.Driver.givenName} ${s.Driver.familyName}`,
      team: s.Constructors[0]?.name || "",
      nationality: s.Driver.nationality,
      points: parseFloat(s.points),
      wins: parseInt(s.wins),
    })),
    ...constructorStandings.map((s) => ({
      season,
      type: "constructor",
      position: parseInt(s.position),
      name: s.Constructor.name,
      nationality: s.Constructor.nationality,
      points: parseFloat(s.points),
      wins: parseInt(s.wins),
    })),
  ];
  for (const s of standingDocs) {
    await Standing.updateOne(
      { season: s.season, type: s.type, position: s.position },
      { $set: s },
      { upsert: true },
    );
  }

  // Team staff (curated).
  let staffCount = 0;
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
      staffCount++;
    }
  }

  return {
    season,
    teams: teams.length,
    drivers: driverCount,
    races: races.length,
    standings: standingDocs.length,
    staff: staffCount,
  };
}

// CLI entry — connects, syncs, disconnects.
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const seasonArg = args.find((a) => a === "current" || /^\d{4}$/.test(a)) || "current";

  console.log(`\n🔄 Syncing "${seasonArg}" from Jolpica (${dryRun ? "DRY RUN" : "writing to DB"})\n`);

  if (dryRun) {
    const data = await fetchSeason(seasonArg);
    console.log(`Season ${data.season}: ${data.teams.length} teams, ${data.races.length} races, ${data.driverStandings.length} drivers`);
    console.log("teams:", data.teams.map((t) => t.name).join(", "));
    console.log("leader:", data.driverStandings[0]?.Driver.familyName, data.driverStandings[0]?.points + "pts");
    console.log("\n✅ Dry run complete — no data written.\n");
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const summary = await syncSeason(seasonArg, { log: console.log });
  await mongoose.disconnect();
  console.log("\n✅ Sync complete:", summary, "\n");
}

if (require.main === module) {
  main().catch((err) => {
    console.error("\n❌ Sync failed:", err.message);
    process.exit(1);
  });
}

module.exports = { syncSeason, fetchSeason, TEAM_STAFF, TEAM_COLORS };
