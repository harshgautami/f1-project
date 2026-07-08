const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { body } = require("express-validator");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const validate = require("../middleware/validate");
const { authLimiter } = require("../middleware/rateLimiter");
const { env } = require("../config/env");

const signToken = (user) =>
  jwt.sign({ id: user._id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const publicUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
});

// Register
router.post(
  "/register",
  authLimiter,
  [
    body("username")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    // role is forced to "user" — clients can never self-assign admin.
    const user = await User.create({ username, email, password, role: "user" });

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  }),
);

// Login
router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  }),
);

// Get current user
router.get(
  "/me",
  auth,
  asyncHandler(async (req, res) => {
    res.json(req.user);
  }),
);

module.exports = router;
