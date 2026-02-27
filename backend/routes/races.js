const express = require("express");
const router = express.Router();
const Race = require("../models/Race");
const { auth, adminOnly } = require("../middleware/auth");

// GET all races
router.get("/", async (req, res) => {
  try {
    const { season, status } = req.query;
    let query = {};
    if (season) query.season = parseInt(season);
    if (status) query.status = status;
    const races = await Race.find(query).sort({ date: 1 });
    res.json(races);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET single race
router.get("/:id", async (req, res) => {
  try {
    const race = await Race.findById(req.params.id).populate(
      "winner",
      "firstName lastName",
    );
    if (!race) return res.status(404).json({ message: "Race not found" });
    res.json(race);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST create race (admin only)
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const race = new Race(req.body);
    await race.save();
    res.status(201).json(race);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating race", error: error.message });
  }
});

// PUT update race (admin only)
router.put("/:id", auth, adminOnly, async (req, res) => {
  try {
    const race = await Race.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!race) return res.status(404).json({ message: "Race not found" });
    res.json(race);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating race", error: error.message });
  }
});

// DELETE race (admin only)
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    const race = await Race.findByIdAndDelete(req.params.id);
    if (!race) return res.status(404).json({ message: "Race not found" });
    res.json({ message: "Race deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
