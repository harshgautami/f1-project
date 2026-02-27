const express = require("express");
const router = express.Router();
const Team = require("../models/Team");
const { auth, adminOnly } = require("../middleware/auth");

// GET all teams (public)
router.get("/", async (req, res) => {
  try {
    const teams = await Team.find().sort({ name: 1 });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET single team
router.get("/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST create team (admin only)
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const team = new Team(req.body);
    await team.save();
    res.status(201).json(team);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating team", error: error.message });
  }
});

// PUT update team (admin only)
router.put("/:id", auth, adminOnly, async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!team) return res.status(404).json({ message: "Team not found" });
    res.json(team);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating team", error: error.message });
  }
});

// DELETE team (admin only)
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    res.json({ message: "Team deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
