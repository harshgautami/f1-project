const rateLimit = require("express-rate-limit");

// General limiter applied to the whole API to blunt abusive traffic.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// Stricter limiter for auth endpoints to slow credential brute-forcing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // Don't count successful logins/registrations against the limit.
  skipSuccessfulRequests: true,
  message: {
    message: "Too many authentication attempts, please try again later.",
  },
});

module.exports = { apiLimiter, authLimiter };
