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
  // Powers the season picker on /races — see UserRaces.
  seasons: true,
  // The per-race classification (22 rows × every round) is only needed by the
  // replay/dashboard — the calendar and admin list get it on ?include=results.
  omitFromList: ["results"],
  populateOne: { path: "winner", select: "firstName lastName" },
  validators,
});
