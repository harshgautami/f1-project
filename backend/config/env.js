const dotenv = require("dotenv");

dotenv.config();

// Fail fast on startup if a required secret is missing, rather than
// discovering it at the first request (or worse, signing tokens with
// `undefined`).
const REQUIRED = ["MONGODB_URI", "JWT_SECRET"];

const validateEnv = () => {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
    console.error("See backend/.env.example for the full list.");
    process.exit(1);
  }
};

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  // Comma-separated list of allowed browser origins for CORS.
  clientUrls: (process.env.CLIENT_URL || "http://localhost:3000")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),
};

module.exports = { env, validateEnv };
