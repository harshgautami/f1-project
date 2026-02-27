const express = require("express");
const router = express.Router();
const RaceHistory = require("../models/RaceHistory");
const { auth, adminOnly } = require("../middleware/auth");

// GET all race history
router.get("/", async (req, res) => {
  try {
    const history = await RaceHistory.find().sort({ year: 1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET by year
router.get("/:year", async (req, res) => {
  try {
    const history = await RaceHistory.findOne({
      year: parseInt(req.params.year),
    });
    if (!history)
      return res.status(404).json({ message: "Race history not found" });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST create (admin only)
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const history = new RaceHistory(req.body);
    await history.save();
    res.status(201).json(history);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating race history", error: error.message });
  }
});

// PUT update (admin only)
router.put("/:id", auth, adminOnly, async (req, res) => {
  try {
    const history = await RaceHistory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!history)
      return res.status(404).json({ message: "Race history not found" });
    res.json(history);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating race history", error: error.message });
  }
});

// DELETE (admin only)
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    const history = await RaceHistory.findByIdAndDelete(req.params.id);
    if (!history)
      return res.status(404).json({ message: "Race history not found" });
    res.json({ message: "Race history deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
