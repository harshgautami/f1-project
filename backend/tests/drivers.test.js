const request = require("supertest");
const { setupDB, teardownDB, clearDB, makeUser } = require("./helpers");

let app;
beforeAll(async () => {
  await setupDB();
  app = require("../server");
}, 120000); // first run may download the in-memory mongod binary
afterEach(clearDB);
afterAll(teardownDB);

async function makeTeam() {
  const Team = require("../models/Team");
  return Team.create({
    name: "Testers",
    fullName: "Test Racing",
    base: "Nowhere",
    teamPrincipal: "Boss",
    powerUnit: "V6",
  });
}

describe("drivers CRUD + authorization", () => {
  test("GET /api/drivers is public and returns an array", async () => {
    const res = await request(app).get("/api/drivers");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("writes require authentication (401) and admin (403)", async () => {
    const team = await makeTeam();
    const driver = {
      firstName: "Max",
      lastName: "Speed",
      number: 1,
      nationality: "NL",
      dateOfBirth: "1997-09-30",
      team: team._id,
    };

    const anon = await request(app).post("/api/drivers").send(driver);
    expect(anon.status).toBe(401);

    const { token } = await makeUser({ role: "user", email: "u@e.com", username: "user1" });
    const forbidden = await request(app)
      .post("/api/drivers")
      .set("Authorization", `Bearer ${token}`)
      .send(driver);
    expect(forbidden.status).toBe(403);
  });

  test("an admin can create, update and delete a driver", async () => {
    const team = await makeTeam();
    const { token } = await makeUser({ role: "admin", email: "a@e.com", username: "admin1" });
    const auth = (r) => r.set("Authorization", `Bearer ${token}`);

    const created = await auth(
      request(app).post("/api/drivers").send({
        firstName: "Lewis",
        lastName: "Hamilton",
        number: 44,
        nationality: "GB",
        dateOfBirth: "1985-01-07",
        team: team._id,
      }),
    );
    expect(created.status).toBe(201);
    expect(created.body.team).toBeTruthy(); // populated on create
    const id = created.body._id;

    const updated = await auth(
      request(app).put(`/api/drivers/${id}`).send({ totalPoints: 100 }),
    );
    expect(updated.status).toBe(200);
    expect(updated.body.totalPoints).toBe(100);

    const del = await auth(request(app).delete(`/api/drivers/${id}`));
    expect(del.status).toBe(200);

    const after = await request(app).get(`/api/drivers/${id}`);
    expect(after.status).toBe(404);
  });

  test("rejects an out-of-range driver number with 400", async () => {
    const team = await makeTeam();
    const { token } = await makeUser({ role: "admin", email: "a2@e.com", username: "admin2" });
    const res = await request(app)
      .post("/api/drivers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstName: "X",
        lastName: "Y",
        number: 999,
        nationality: "GB",
        dateOfBirth: "2000-01-01",
        team: team._id,
      });
    expect(res.status).toBe(400);
  });
});
