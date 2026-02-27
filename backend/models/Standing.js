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

module.exports = mongoose.model("Standing", standingSchema);
