const mongoose = require("mongoose");

const raceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Race name is required"],
      trim: true,
    },
    circuit: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    city: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
    },
    season: {
      type: Number,
      required: true,
    },
    round: {
      type: Number,
      required: true,
    },
    laps: {
      type: Number,
    },
    circuitLength: {
      type: String,
    },
    status: {
      type: String,
      enum: ["upcoming", "completed", "cancelled"],
      default: "upcoming",
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },
    winnerName: String,
    winnerTeam: String,
    fastestLap: String,
    results: [
      {
        position: Number,
        driver: String,
        team: String,
        time: String,
        points: Number,
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Race", raceSchema);
