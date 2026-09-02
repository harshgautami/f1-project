const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const validate = require("../middleware/validate");
const { auth, adminOnly } = require("../middleware/auth");

/**
 * Builds a standard REST router (list / get one / create / update / delete)
 * from a Mongoose model, so the near-identical CRUD code in every resource
 * lives in exactly one place.
 *
 * @param {Object}  opts
 * @param {import('mongoose').Model} opts.model    Mongoose model.
 * @param {string}  opts.name        Human label used in messages (e.g. "Driver").
 * @param {Array}   [opts.listFilters]  [{ param, field?, cast? }] query filters.
 * @param {Object}  [opts.sort]       Sort spec for the list route.
 * @param {Array|string} [opts.populate]     Populate spec for list + writes.
 * @param {Array|string} [opts.populateOne]  Populate spec for GET /:id (defaults to populate).
 * @param {Array}   [opts.validators]  express-validator chain for POST/PUT.
 * @param {boolean} [opts.getOne=true] Whether to mount GET /:id.
 * @param {number}  [opts.maxLimit=200] Cap on ?limit page size.
 * @param {string[]} [opts.omitFromList] Heavy fields left out of the list
 *   unless the client asks with ?include=field (GET /:id always has them).
 */
function crudRouter(opts) {
  const {
    model,
    name,
    listFilters = [],
    sort = {},
    populate = null,
    populateOne = null,
    validators = [],
    getOne = true,
    maxLimit = 200,
    omitFromList = [],
  } = opts;

  const router = express.Router();
  const applyPopulate = (q, spec) => (spec ? q.populate(spec) : q);
  const notFound = { message: `${name} not found` };

  // GET list — supports per-resource filters plus opt-in ?page/?limit
  // pagination. Still returns a plain array (with an X-Total-Count header)
  // so existing clients keep working.
  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const query = {};
      for (const { param, field, cast } of listFilters) {
        const value = req.query[param];
        if (value !== undefined && value !== "") {
          query[field || param] = cast ? cast(value) : value;
        }
      }

      const include = String(req.query.include || "")
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
      const projection = omitFromList
        .filter((f) => !include.includes(f))
        .map((f) => `-${f}`)
        .join(" ");

      // .lean(): plain objects serialise several times faster than documents.
      let dbQuery = applyPopulate(model.find(query, projection || undefined), populate)
        .sort(sort)
        .lean();

      const hasPaging =
        req.query.page !== undefined || req.query.limit !== undefined;
      if (hasPaging) {
        const limit = Math.min(
          Math.max(parseInt(req.query.limit) || 20, 1),
          maxLimit,
        );
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const total = await model.countDocuments(query);
        res.set("X-Total-Count", String(total));
        dbQuery = dbQuery.skip((page - 1) * limit).limit(limit);
      }

      res.json(await dbQuery);
    }),
  );

  // GET single by id
  if (getOne) {
    router.get(
      "/:id",
      asyncHandler(async (req, res) => {
        const doc = await applyPopulate(
          model.findById(req.params.id),
          populateOne || populate,
        );
        if (!doc) return res.status(404).json(notFound);
        res.json(doc);
      }),
    );
  }

  const writeGuards = [auth, adminOnly, ...validators, validate];

  // POST create (admin only)
  router.post(
    "/",
    ...writeGuards,
    asyncHandler(async (req, res) => {
      const created = await model.create(req.body);
      const doc = populate
        ? await applyPopulate(model.findById(created._id), populate)
        : created;
      res.status(201).json(doc);
    }),
  );

  // PUT update (admin only)
  router.put(
    "/:id",
    ...writeGuards,
    asyncHandler(async (req, res) => {
      const doc = await applyPopulate(
        model.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true,
        }),
        populate,
      );
      if (!doc) return res.status(404).json(notFound);
      res.json(doc);
    }),
  );

  // DELETE (admin only)
  router.delete(
    "/:id",
    auth,
    adminOnly,
    asyncHandler(async (req, res) => {
      const doc = await model.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json(notFound);
      res.json({ message: `${name} deleted successfully` });
    }),
  );

  return router;
}

module.exports = crudRouter;
