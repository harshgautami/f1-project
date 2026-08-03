// Local development bootstrap.
//
// The Atlas cluster referenced by MONGODB_URI in .env may be unreachable
// (deleted/renamed cluster => DNS NXDOMAIN). This script stands up a real
// MongoDB locally via mongodb-memory-server on a fixed port, persists its
// data under backend/.local-mongo-data, seeds the default accounts on first
// run, then starts the Express API against it.
//
// Usage: npm run dev:local   (from backend/)

const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

const DB_PORT = 27017;
const DB_NAME = "f1management";
const DATA_DIR = path.join(__dirname, "..", ".local-mongo-data");

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  console.log("Starting local MongoDB (mongodb-memory-server)...");
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: DB_PORT,
      dbName: DB_NAME,
      dbPath: DATA_DIR,
      storageEngine: "wiredTiger",
    },
  });

  const uri = mongod.getUri(DB_NAME);
  // Set before requiring config/env so dotenv (which does not override
  // already-set vars) leaves our local URI in place.
  process.env.MONGODB_URI = uri;
  console.log(`Local MongoDB ready at ${uri}`);

  // Seed on first run (empty database).
  const User = require("../models/User");
  await mongoose.connect(uri);
  const userCount = await User.countDocuments();
  await mongoose.disconnect();

  if (userCount === 0) {
    console.log("Empty database detected -> seeding sample data...");
    const seedPath = path.join(__dirname, "..", "seeds", "seed.js");
    const result = spawnSync(process.execPath, [seedPath], {
      stdio: "inherit",
      env: { ...process.env, MONGODB_URI: uri },
    });
    if (result.status !== 0) {
      console.error("Seeding failed; aborting.");
      await mongod.stop();
      process.exit(1);
    }
  } else {
    console.log(`Database already has ${userCount} user(s); skipping seed.`);
  }

  // Boot the API against the local DB. server.js only calls app.listen when
  // run as the main module, so start it ourselves here.
  const app = require("../server");
  const { env } = require("../config/env");
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port} (local dev DB)`);
    console.log("Admin: admin@f1management.com / admin123");
    console.log("User:  user@f1management.com / user123");
  });

  const shutdown = async () => {
    console.log("\nShutting down local MongoDB...");
    await mongoose.disconnect().catch(() => {});
    await mongod.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("dev-local bootstrap failed:", err);
  process.exit(1);
});
