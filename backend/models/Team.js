const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    // Jolpica/Ergast constructorId ("red_bull") — the stable key the data sync
    // upserts on, so renamed teams and seed/API name clashes can't duplicate.
    constructorId: {
      type: String,
      index: { unique: true, sparse: true },
    },
    name: {
      type: String,
      required: [true, "Team name is required"],
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    base: {
      type: String,
      required: true,
    },
    teamPrincipal: {
      type: String,
      required: true,
    },
    powerUnit: {
      type: String,
      required: true,
    },
    chassis: {
      type: String,
    },
    firstEntry: {
      type: Number,
    },
    worldChampionships: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: "#ffffff",
    },
    logoUrl: {
      type: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Team", teamSchema);
