const { body } = require("express-validator");
const Driver = require("../models/Driver");
const crudRouter = require("../utils/crudRouter");

const validators = [
  body("firstName").optional().trim().notEmpty(),
  body("lastName").optional().trim().notEmpty(),
  body("number").optional().isInt({ min: 0, max: 99 }),
  body("team").optional().isMongoId().withMessage("Invalid team id"),
  body("worldChampionships").optional().isInt({ min: 0 }),
  body("totalRaceWins").optional().isInt({ min: 0 }),
  body("totalPodiums").optional().isInt({ min: 0 }),
  body("totalPoints").optional().isFloat({ min: 0 }),
];

module.exports = crudRouter({
  model: Driver,
  name: "Driver",
  listFilters: [{ param: "team", field: "team" }],
  sort: { lastName: 1 },
  populate: { path: "team", select: "name color" },
  populateOne: { path: "team", select: "name color fullName" },
  validators,
});
