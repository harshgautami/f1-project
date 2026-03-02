const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Something went wrong!", error: err.message });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
