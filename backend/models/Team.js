const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
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
