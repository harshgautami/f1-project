const mongoose = require("mongoose");

const standingSchema = new mongoose.Schema(
  {
    season: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["driver", "constructor"],
      required: true,
    },
    position: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    team: {
      type: String,
    },
    nationality: {
      type: String,
    },
    points: {
      type: Number,
      default: 0,
    },
    wins: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// Standings are almost always queried by season + type and shown ordered by
// position (see UserStandings / dashboard) — index that access path.
standingSchema.index({ season: 1, type: 1, position: 1 });

module.exports = mongoose.model("Standing", standingSchema);
