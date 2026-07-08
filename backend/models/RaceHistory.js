const mongoose = require("mongoose");

const raceHistorySchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
    },
    totalRaces: {
      type: Number,
      required: true,
    },
    champion: {
      type: String,
      required: true,
    },
    championTeam: {
      type: String,
      required: true,
    },
    constructorChampion: {
      type: String,
      required: true,
    },
    teamWins: [
      {
        team: String,
        wins: Number,
        color: String,
      },
    ],
  },
  { timestamps: true },
);

// One document per season; list + ?year= lookups sort/filter on year.
raceHistorySchema.index({ year: 1 });

module.exports = mongoose.model("RaceHistory", raceHistorySchema);
