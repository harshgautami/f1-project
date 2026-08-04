const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { env, validateEnv } = require("./config/env");
const connectDB = require("./config/db");
const { apiLimiter } = require("./middleware/rateLimiter");
const { notFound, errorHandler } = require("./middleware/errorHandler");

// Fail fast if required secrets are missing.
validateEnv();

const app = express();

// Connect to MongoDB
connectDB();

// Security headers
app.use(helmet());

// Restrict cross-origin access to the configured client origin(s).
app.use(
  cors({
    origin: "https://f1-project-phi.vercel.app",
    credentials: true,
  }),
);

// Body parsing with a sane size limit to reduce abuse surface.
app.use(express.json({ limit: "1mb" }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration} ms`,
    );
  });
  next();
});

// Rate limiting across the API (auth routes add a stricter limiter of their own)
app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/teams", require("./routes/teams"));
app.use("/api/drivers", require("./routes/drivers"));
app.use("/api/races", require("./routes/races"));
app.use("/api/standings", require("./routes/standings"));
app.use("/api/team-staff", require("./routes/teamStaff"));
app.use("/api/race-history", require("./routes/raceHistory"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "F1 Management API is running" });
});

// 404 + centralized error handling (must be last)
app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

module.exports = app;
