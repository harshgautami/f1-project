const request = require("supertest");
const { setupDB, teardownDB, clearDB } = require("./helpers");

let app;
beforeAll(async () => {
  await setupDB();
  app = require("../server");
}, 120000); // first run may download the in-memory mongod binary
afterEach(clearDB);
afterAll(teardownDB);

describe("auth", () => {
  test("registers a new user and returns a token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "alice", email: "alice@example.com", password: "secret123" });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toMatchObject({ username: "alice", role: "user" });
  });

  test("never lets a client self-assign admin at registration", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "mallory",
        email: "m@example.com",
        password: "secret123",
        role: "admin",
      });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("user");
  });

  test("rejects duplicate registration with 409", async () => {
    const body = { username: "bob", email: "bob@example.com", password: "secret123" };
    await request(app).post("/api/auth/register").send(body);
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...body, username: "bob2" });
    expect(res.status).toBe(409);
  });

  test("validates input (short password / bad email) with 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "xy", email: "not-an-email", password: "123" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test("logs in with valid credentials and rejects invalid ones", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ username: "carol", email: "carol@example.com", password: "secret123" });

    const ok = await request(app)
      .post("/api/auth/login")
      .send({ email: "carol@example.com", password: "secret123" });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeTruthy();

    const bad = await request(app)
      .post("/api/auth/login")
      .send({ email: "carol@example.com", password: "wrong-password" });
    expect(bad.status).toBe(400);
  });

  test("/auth/me requires a valid token and never leaks the password", async () => {
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ username: "dave", email: "dave@example.com", password: "secret123" });

    const noAuth = await request(app).get("/api/auth/me");
    expect(noAuth.status).toBe(401);

    const withAuth = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${reg.body.token}`);
    expect(withAuth.status).toBe(200);
    expect(withAuth.body.email).toBe("dave@example.com");
    expect(withAuth.body.password).toBeUndefined();
  });
});
