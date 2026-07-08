const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

let mongo;

/**
 * Boots an in-memory MongoDB and connects mongoose to it BEFORE the app is
 * required. server.js's connectDB() sees an existing connection and no-ops, so
 * the app under test talks to the ephemeral database.
 */
async function setupDB() {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";
  process.env.JWT_EXPIRES_IN = "1h";
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
}

async function teardownDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}

async function clearDB() {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

/** Creates a user directly (bypassing rate limits) and returns a signed token. */
async function makeUser({ role = "user", username = "tester", email = "t@e.com", password = "secret123" } = {}) {
  const User = require("../models/User");
  const user = await User.create({ username, email, password, role });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return { user, token };
}

module.exports = { setupDB, teardownDB, clearDB, makeUser };
