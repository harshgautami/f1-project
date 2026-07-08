const { body } = require("express-validator");
const Race = require("../models/Race");
const crudRouter = require("../utils/crudRouter");

const validators = [
  body("name").optional().trim().notEmpty(),
  body("date").optional().isISO8601().withMessage("Invalid date"),
  body("season").optional().isInt({ min: 1950, max: 2100 }),
  body("round").optional().isInt({ min: 1 }),
  body("laps").optional().isInt({ min: 1 }),
  body("status").optional().isIn(["upcoming", "completed", "cancelled"]),
  body("winner").optional({ nullable: true }).isMongoId(),
];

module.exports = crudRouter({
  model: Race,
  name: "Race",
  listFilters: [
    { param: "season", field: "season", cast: (v) => parseInt(v) },
    { param: "status", field: "status" },
  ],
  sort: { date: 1 },
  populateOne: { path: "winner", select: "firstName lastName" },
  validators,
});
