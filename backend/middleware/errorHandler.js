const { env } = require("../config/env");

// 404 handler for unmatched routes.
const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

// Centralized error handler. Maps common Mongoose errors to sensible status
// codes and only exposes internal error details outside of production.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Something went wrong";

  // Mongoose validation error -> 400
  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Invalid ObjectId (e.g. GET /drivers/not-an-id) -> 400
  if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Duplicate key (unique index) -> 409
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `A record with that ${field} already exists`;
  }

  if (status >= 500) {
    console.error(err.stack || err);
  }

  const body = { message };
  // Never leak stack traces / raw error details to clients in production.
  if (!env.isProduction && status >= 500) {
    body.error = err.message;
  }

  res.status(status).json(body);
};

module.exports = { notFound, errorHandler };
