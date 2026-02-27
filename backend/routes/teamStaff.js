const express = require("express");
const router = express.Router();
const TeamStaff = require("../models/TeamStaff");
const { auth, adminOnly } = require("../middleware/auth");

// GET all staff
router.get("/", async (req, res) => {
  try {
    const { team, department } = req.query;
    let query = {};
    if (team) query.team = team;
    if (department) query.department = department;
    const staff = await TeamStaff.find(query)
      .populate("team", "name color")
      .sort({ department: 1, name: 1 });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET single staff
router.get("/:id", async (req, res) => {
  try {
    const staff = await TeamStaff.findById(req.params.id).populate(
      "team",
      "name color",
    );
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST create staff (admin only)
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const staff = new TeamStaff(req.body);
    await staff.save();
    const populated = await TeamStaff.findById(staff._id).populate(
      "team",
      "name color",
    );
    res.status(201).json(populated);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating staff", error: error.message });
  }
});

// PUT update staff (admin only)
router.put("/:id", auth, adminOnly, async (req, res) => {
  try {
    const staff = await TeamStaff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("team", "name color");
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    res.json(staff);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating staff", error: error.message });
  }
});

// DELETE staff (admin only)
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    const staff = await TeamStaff.findByIdAndDelete(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    res.json({ message: "Staff deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
