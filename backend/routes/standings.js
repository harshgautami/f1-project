const express = require("express");
const router = express.Router();
const Standing = require("../models/Standing");
const { auth, adminOnly } = require("../middleware/auth");

// GET standings
router.get("/", async (req, res) => {
  try {
    const { season, type } = req.query;
    let query = {};
    if (season) query.season = parseInt(season);
    if (type) query.type = type;
    const standings = await Standing.find(query).sort({ position: 1 });
    res.json(standings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST create standing (admin only)
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const standing = new Standing(req.body);
    await standing.save();
    res.status(201).json(standing);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating standing", error: error.message });
  }
});

// PUT update standing (admin only)
router.put("/:id", auth, adminOnly, async (req, res) => {
  try {
    const standing = await Standing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!standing)
      return res.status(404).json({ message: "Standing not found" });
    res.json(standing);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating standing", error: error.message });
  }
});

// DELETE standing (admin only)
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    const standing = await Standing.findByIdAndDelete(req.params.id);
    if (!standing)
      return res.status(404).json({ message: "Standing not found" });
    res.json({ message: "Standing deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
