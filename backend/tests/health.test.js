const request = require("supertest");
const { setupDB, teardownDB } = require("./helpers");

let app;
beforeAll(async () => {
  await setupDB();
  app = require("../server");
}, 120000); // first run may download the in-memory mongod binary
afterAll(teardownDB);

test("GET /api/health returns OK", async () => {
  const res = await request(app).get("/api/health");
  expect(res.status).toBe(200);
  expect(res.body.status).toBe("OK");
});

test("unknown routes return a 404 JSON body", async () => {
  const res = await request(app).get("/api/does-not-exist");
  expect(res.status).toBe(404);
  expect(res.body.message).toMatch(/not found/i);
});
