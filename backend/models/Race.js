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
        positionText: String, // "1", "R" (retired), "D", etc.
        driver: String,
        code: String, // 3-letter driver code (e.g. VER)
        number: Number,
        team: String,
        color: String, // team colour for the live replay
        grid: Number, // starting grid slot (0 = pit lane)
        laps: Number, // laps completed
        status: String, // "Finished", "+1 Lap", "Accident", ...
        time: String,
        points: Number,
        fastestLap: Boolean,
      },
    ],
  },
  { timestamps: true },
);

// The calendar is queried by season (and filtered by status), ordered by round.
raceSchema.index({ season: 1, round: 1 });
raceSchema.index({ season: 1, status: 1 });

module.exports = mongoose.model("Race", raceSchema);
