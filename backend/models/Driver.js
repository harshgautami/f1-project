const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    // Jolpica/Ergast driverId ("max_verstappen") — the stable key the data
    // sync upserts on (name spellings vary: "Hulkenberg" vs "Hülkenberg").
    driverId: {
      type: String,
      index: { unique: true, sparse: true },
    },
    code: {
      type: String, // three-letter abbreviation, e.g. VER
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    number: {
      type: Number,
      required: true,
    },
    nationality: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: String,
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    worldChampionships: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRaceWins: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPodiums: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    seasonsActive: {
      type: String,
    },
    biography: {
      type: String,
    },
    history: [
      {
        year: Number,
        team: String,
        position: Number,
        wins: Number,
        podiums: Number,
        points: Number,
      },
    ],
    imageUrl: {
      type: String,
    },
  },
  { timestamps: true },
);

// Drivers are commonly filtered by team.
driverSchema.index({ team: 1 });

module.exports = mongoose.model("Driver", driverSchema);
