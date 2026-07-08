const { body } = require("express-validator");
const Team = require("../models/Team");
const crudRouter = require("../utils/crudRouter");

// Presence of required fields is enforced by the Mongoose schema; these
// checks add format/sanitization on top and work for both create and update.
const validators = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("fullName").optional().trim().notEmpty(),
  body("worldChampionships").optional().isInt({ min: 0 }),
  body("firstEntry").optional().isInt({ min: 1900, max: 2100 }),
  body("color")
    .optional()
    .matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .withMessage("Color must be a hex value like #ff0000"),
];

module.exports = crudRouter({
  model: Team,
  name: "Team",
  sort: { name: 1 },
  validators,
});
