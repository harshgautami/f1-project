/* ---------------------------------------------------------------------------
   Database reset.

   DESTRUCTIVE: wipes every collection, recreates the two demo accounts, then
   (unless --users-only) rebuilds all F1 data from the real Jolpica API via
   scripts/sync.js — the last 13 seasons plus the current one, with the current
   grid, real results, championship tables and driver careers.

   No hand-typed race data lives here any more: the sync is the single source
   of truth, so the seed can never disagree with it.

   Usage (from backend/):
     node seeds/seed.js                # reset + full real-data sync (~4–6 min)
     node seeds/seed.js --users-only   # reset + accounts only (no network)

   Run this against the LOCAL dev database (scripts/dev-local.js does so on
   first boot). Never point it at a shared/production database casually.
   --------------------------------------------------------------------------- */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const User = require("../models/User");
const Team = require("../models/Team");
const Driver = require("../models/Driver");
const Race = require("../models/Race");
const Standing = require("../models/Standing");
const TeamStaff = require("../models/TeamStaff");
const RaceHistory = require("../models/RaceHistory");
const { syncRange, SEASON_FROM, CURRENT_YEAR } = require("../scripts/sync");

const ACCOUNTS = [
  { username: "admin", email: "admin@f1management.com", password: "admin123", role: "admin" },
  { username: "user", email: "user@f1management.com", password: "user123", role: "user" },
];

async function seedDB() {
  const usersOnly = process.argv.includes("--users-only");

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected for seeding");

  console.log("Clearing existing data...");
  await Promise.all(
    [User, Team, Driver, Race, Standing, TeamStaff, RaceHistory].map((M) => M.deleteMany({})),
  );

  console.log("Creating accounts...");
  for (const a of ACCOUNTS) await User.create(a);

  let failed = 0;
  if (usersOnly) {
    console.log("--users-only: skipping the data sync.");
  } else {
    console.log(`\nSyncing real F1 data ${SEASON_FROM}–${CURRENT_YEAR} from Jolpica (no API key needed)…`);
    const summaries = await syncRange(SEASON_FROM, CURRENT_YEAR, {
      log: console.log,
      prune: true,
    });
    failed = CURRENT_YEAR - SEASON_FROM + 1 - summaries.length;
  }

  await mongoose.disconnect();

  console.log("\nDatabase seeded successfully!");
  console.log("Admin: admin@f1management.com / admin123");
  console.log("User:  user@f1management.com / user123");
  if (failed) {
    console.error(`\n⚠️  ${failed} season(s) failed to sync — re-run: node scripts/sync.js <year>`);
    process.exit(1);
  }
  process.exit(0);
}

seedDB().catch((error) => {
  console.error("Seeding error:", error);
  process.exit(1);
});
