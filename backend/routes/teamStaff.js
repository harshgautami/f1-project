const { body } = require("express-validator");
const TeamStaff = require("../models/TeamStaff");
const crudRouter = require("../utils/crudRouter");

const DEPARTMENTS = [
  "mechanical",
  "physical",
  "pitstop",
  "strategy",
  "management",
  "aerodynamics",
];

const validators = [
  body("name").optional().trim().notEmpty(),
  body("role").optional().trim().notEmpty(),
  body("department").optional().isIn(DEPARTMENTS),
  body("team").optional().isMongoId().withMessage("Invalid team id"),
];

module.exports = crudRouter({
  model: TeamStaff,
  name: "Staff",
  listFilters: [
    { param: "team", field: "team" },
    { param: "department", field: "department" },
  ],
  sort: { department: 1, name: 1 },
  populate: { path: "team", select: "name color" },
  validators,
});
