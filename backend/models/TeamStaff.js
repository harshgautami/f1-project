const mongoose = require("mongoose");

const teamStaffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Staff name is required"],
      trim: true,
    },
    role: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      enum: [
        "mechanical",
        "physical",
        "pitstop",
        "strategy",
        "management",
        "aerodynamics",
      ],
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    teamName: {
      type: String,
    },
    experience: {
      type: String,
    },
    nationality: {
      type: String,
    },
  },
  { timestamps: true },
);

// Staff lists are filtered by team and/or department.
teamStaffSchema.index({ team: 1, department: 1 });

module.exports = mongoose.model("TeamStaff", teamStaffSchema);
