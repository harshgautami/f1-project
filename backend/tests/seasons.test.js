const request = require("supertest");
const { setupDB, teardownDB, clearDB } = require("./helpers");

let app;
beforeAll(async () => {
  await setupDB();
  app = require("../server");
}, 120000); // first run may download the in-memory mongod binary
afterEach(clearDB);
afterAll(teardownDB);

const Race = () => require("../models/Race");
const Standing = () => require("../models/Standing");

describe("GET /seasons — what the database actually holds", () => {
  test("standings report their distinct seasons, newest first", async () => {
    await Standing().create([
      { season: 2024, type: "driver", position: 1, name: "A", points: 10 },
      { season: 2024, type: "constructor", position: 1, name: "T", points: 10 },
      { season: 2022, type: "driver", position: 1, name: "B", points: 8 },
    ]);
    const res = await request(app).get("/api/standings/seasons");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([2024, 2022]);
  });

  test("races report theirs too, and an empty collection is an empty list", async () => {
    let res = await request(app).get("/api/races/seasons");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);

    await Race().create([
      { name: "A GP", circuit: "A", country: "A", date: new Date("2026-03-08"), season: 2026, round: 1 },
      { name: "B GP", circuit: "B", country: "B", date: new Date("2025-03-08"), season: 2025, round: 1 },
    ]);
    res = await request(app).get("/api/races/seasons");
    expect(res.body).toEqual([2026, 2025]);
  });

  // The route is declared before GET /:id; without that ordering Express would
  // hand "seasons" to the id handler and answer 404 (or cast-error).
  test("does not shadow GET /races/:id", async () => {
    const race = await Race().create({
      name: "C GP",
      circuit: "C",
      country: "C",
      date: new Date("2026-03-08"),
      season: 2026,
      round: 1,
    });
    const res = await request(app).get(`/api/races/${race._id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("C GP");
  });

  test("it is public — the user side reads it before signing anything", async () => {
    const res = await request(app).get("/api/standings/seasons");
    expect(res.status).toBe(200);
  });
});
