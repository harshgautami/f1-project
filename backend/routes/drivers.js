const express = require("express");
const router = express.Router();
const Driver = require("../models/Driver");
const { auth, adminOnly } = require("../middleware/auth");

// GET all drivers
router.get("/", async (req, res) => {
  try {
    const { team } = req.query;
    let query = {};
    if (team) query.team = team;
    const drivers = await Driver.find(query)
      .populate("team", "name color")
      .sort({ lastName: 1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET single driver
router.get("/:id", async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).populate(
      "team",
      "name color fullName",
    );
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST create driver (admin only)
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const driver = new Driver(req.body);
    await driver.save();
    const populated = await Driver.findById(driver._id).populate(
      "team",
      "name color",
    );
    res.status(201).json(populated);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating driver", error: error.message });
  }
});

// PUT update driver (admin only)
router.put("/:id", auth, adminOnly, async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("team", "name color");
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    res.json(driver);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating driver", error: error.message });
  }
});

// DELETE driver (admin only)
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    res.json({ message: "Driver deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
