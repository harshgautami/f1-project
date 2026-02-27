const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
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
    },
    totalRaceWins: {
      type: Number,
      default: 0,
    },
    totalPodiums: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
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

module.exports = mongoose.model("Driver", driverSchema);
