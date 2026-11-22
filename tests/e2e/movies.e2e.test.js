const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../app");
const Movie = require("../../models/movie.model");

const MONGO_URI_TEST =
  process.env.MONGO_URI_TEST || "mongodb://localhost:27017/movie-reviews-test";

const NONEXISTENT_ID = "64b7f0c2a1b2c3d4e5f60718";

beforeAll(async () => {
  // The MongoDB driver (v7.8+) loads `os` via dynamic import(), which Jest's VM sandbox
  // doesn't support; the error is swallowed and the handshake fails with
  // "Missing required sub-document 'driver'". Passing `os` explicitly avoids that path.
  await mongoose.connect(MONGO_URI_TEST, { runtimeAdapters: { os: require("os") } });
});

beforeEach(async () => {
  await Movie.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("GET /", () => {
  it("returns the hello text", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Hello, World!/);
  });
});

describe("Movies CRUD flow", () => {
  it("creates, reads, updates and deletes a movie", async () => {
    // Create
    const createRes = await request(app).post("/movies").send({
      title: "  Inception  ",
      year: 2010,
      director: "Christopher Nolan",
      genre: "Sci-Fi",
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body._id).toBeDefined();
    expect(createRes.body.createdAt).toBeDefined();
    expect(createRes.body.title).toBe("Inception"); // trimmed by schema
    const id = createRes.body._id;

    // List
    const listRes = await request(app).get("/movies");
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0]._id).toBe(id);

    // Get by id
    const getRes = await request(app).get(`/movies/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.title).toBe("Inception");

    // Update (full replacement: omitted fields are removed)
    const putRes = await request(app)
      .put(`/movies/${id}`)
      .send({ title: "Inception (Director's Cut)", year: 2011 });
    expect(putRes.status).toBe(200);
    expect(putRes.body.title).toBe("Inception (Director's Cut)");
    expect(putRes.body.year).toBe(2011);
    expect(putRes.body.director).toBeUndefined();
    expect(putRes.body.genre).toBeUndefined();
    expect(putRes.body.createdAt).toBe(createRes.body.createdAt);

    // Delete
    const delRes = await request(app).delete(`/movies/${id}`);
    expect(delRes.status).toBe(204);

    const afterDel = await request(app).get(`/movies/${id}`);
    expect(afterDel.status).toBe(404);
  });
});

describe("Validation", () => {
  it("POST without title returns 400", async () => {
    const res = await request(app).post("/movies").send({ year: 2000 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/);
  });

  it("PUT without title returns 400", async () => {
    const movie = await Movie.create({ title: "Heat" });
    const res = await request(app).put(`/movies/${movie._id}`).send({ year: 1995 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/);
  });
});

describe("Filtering by year", () => {
  beforeEach(async () => {
    await Movie.create([
      { title: "Inception", year: 2010 },
      { title: "Toy Story 3", year: 2010 },
      { title: "Heat", year: 1995 },
    ]);
  });

  it("returns only movies from the given year", async () => {
    const res = await request(app).get("/movies?year=2010");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.every((m) => m.year === 2010)).toBe(true);
  });

  it("returns 400 for a non-numeric year", async () => {
    const res = await request(app).get("/movies?year=abc");
    expect(res.status).toBe(400);
  });
});

describe("Ids", () => {
  it.each([
    ["get", "/movies/not-an-id"],
    ["put", "/movies/not-an-id"],
    ["delete", "/movies/not-an-id"],
  ])("%s with an invalid ObjectId returns 404", async (method, url) => {
    const res = await request(app)[method](url).send({ title: "X" });
    expect(res.status).toBe(404);
  });

  it.each([["get"], ["put"], ["delete"]])(
    "%s with a valid but nonexistent id returns 404",
    async (method) => {
      const res = await request(app)[method](`/movies/${NONEXISTENT_ID}`).send({ title: "X" });
      expect(res.status).toBe(404);
    }
  );
});
