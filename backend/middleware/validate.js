const { validationResult } = require("express-validator");

// Runs after a list of express-validator checks. If any failed, responds
// with 400 and the collected errors; otherwise passes control on.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = validate;
