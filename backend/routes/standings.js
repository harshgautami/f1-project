const { body } = require("express-validator");
const Standing = require("../models/Standing");
const crudRouter = require("../utils/crudRouter");

const validators = [
  body("season").optional().isInt({ min: 1950, max: 2100 }),
  body("type").optional().isIn(["driver", "constructor"]),
  body("position").optional().isInt({ min: 1 }),
  body("name").optional().trim().notEmpty(),
  body("points").optional().isFloat({ min: 0 }),
  body("wins").optional().isInt({ min: 0 }),
];

module.exports = crudRouter({
  model: Standing,
  name: "Standing",
  listFilters: [
    { param: "season", field: "season", cast: (v) => parseInt(v) },
    { param: "type", field: "type" },
  ],
  sort: { position: 1 },
  getOne: false,
  // Powers the season picker on /standings — see UserStandings.
  seasons: true,
  validators,
});
