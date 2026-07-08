const { body } = require("express-validator");
const RaceHistory = require("../models/RaceHistory");
const crudRouter = require("../utils/crudRouter");

// Presence of required fields is enforced by the Mongoose schema; these add
// format checks on top and apply to both create and update.
const validators = [
  body("year").optional().isInt({ min: 1950, max: 2100 }),
  body("totalRaces").optional().isInt({ min: 0 }),
  body("champion").optional().trim().notEmpty(),
  body("championTeam").optional().trim().notEmpty(),
  body("constructorChampion").optional().trim().notEmpty(),
  body("teamWins").optional().isArray(),
];

// Previously a hand-rolled router with its own try/catch in every handler.
// Now consistent with every other resource: shared CRUD, admin-guarded writes,
// centralized error handling. The old GET /:year lookup becomes ?year= on the
// list route (the only race-history endpoint the frontend actually calls).
module.exports = crudRouter({
  model: RaceHistory,
  name: "Race history",
  sort: { year: 1 },
  getOne: false,
  listFilters: [{ param: "year", field: "year", cast: (v) => parseInt(v) }],
  validators,
});
