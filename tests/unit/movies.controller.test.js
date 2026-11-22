jest.mock("../../models/movie.model", () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

const Movie = require("../../models/movie.model");
const {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} = require("../../controllers/movies.controller");

const VALID_ID = "64b7f0c2a1b2c3d4e5f60718";
const INVALID_ID = "not-an-id";

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = ({ params = {}, query = {}, body = {} } = {}) => ({ params, query, body });

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getAllMovies", () => {
  it("returns all movies when no filter is given", async () => {
    const movies = [{ title: "A" }, { title: "B" }];
    Movie.find.mockResolvedValue(movies);
    const res = mockRes();

    await getAllMovies(mockReq(), res);

    expect(Movie.find).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith(movies);
  });

  it("filters by numeric year", async () => {
    Movie.find.mockResolvedValue([]);
    const res = mockRes();

    await getAllMovies(mockReq({ query: { year: "2010" } }), res);

    expect(Movie.find).toHaveBeenCalledWith({ year: 2010 });
  });

  it("returns 400 for a non-numeric year without querying the DB", async () => {
    const res = mockRes();

    await getAllMovies(mockReq({ query: { year: "abc" } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "year must be a number" });
    expect(Movie.find).not.toHaveBeenCalled();
  });
});

describe("getMovieById", () => {
  it("returns 404 for an invalid id without querying the DB", async () => {
    const res = mockRes();

    await getMovieById(mockReq({ params: { id: INVALID_ID } }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(Movie.findById).not.toHaveBeenCalled();
  });

  it("returns 404 when the movie does not exist", async () => {
    Movie.findById.mockResolvedValue(null);
    const res = mockRes();

    await getMovieById(mockReq({ params: { id: VALID_ID } }), res);

    expect(Movie.findById).toHaveBeenCalledWith(VALID_ID);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns the movie when found", async () => {
    const movie = { _id: VALID_ID, title: "Inception" };
    Movie.findById.mockResolvedValue(movie);
    const res = mockRes();

    await getMovieById(mockReq({ params: { id: VALID_ID } }), res);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(movie);
  });
});

describe("createMovie", () => {
  it("creates a movie from whitelisted fields only and responds 201", async () => {
    const created = { _id: VALID_ID, title: "Inception" };
    Movie.create.mockResolvedValue(created);
    const res = mockRes();
    const body = {
      title: "Inception",
      year: 2010,
      director: "Nolan",
      genre: "Sci-Fi",
      description: "Dreams",
      _id: "hacked",
      foo: "bar",
    };

    await createMovie(mockReq({ body }), res);

    expect(Movie.create).toHaveBeenCalledWith({
      title: "Inception",
      year: 2010,
      director: "Nolan",
      genre: "Sci-Fi",
      description: "Dreams",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  it("propagates model errors (Express 5 forwards them to the error handler)", async () => {
    const err = Object.assign(new Error("title is required"), { name: "ValidationError" });
    Movie.create.mockRejectedValue(err);

    await expect(createMovie(mockReq({ body: {} }), mockRes())).rejects.toBe(err);
  });
});

describe("updateMovie", () => {
  it("returns 404 for an invalid id without querying the DB", async () => {
    const res = mockRes();

    await updateMovie(mockReq({ params: { id: INVALID_ID }, body: { title: "X" } }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(Movie.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("sets provided fields, unsets omitted ones, and runs validators", async () => {
    const updated = { _id: VALID_ID, title: "New", year: 2020 };
    Movie.findByIdAndUpdate.mockResolvedValue(updated);
    const res = mockRes();

    await updateMovie(
      mockReq({ params: { id: VALID_ID }, body: { title: "New", year: 2020, foo: "x" } }),
      res
    );

    expect(Movie.findByIdAndUpdate).toHaveBeenCalledWith(
      VALID_ID,
      {
        $set: { title: "New", year: 2020 },
        $unset: { director: "", genre: "", description: "" },
      },
      { returnDocument: "after", runValidators: true }
    );
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it("returns 404 when the movie does not exist", async () => {
    Movie.findByIdAndUpdate.mockResolvedValue(null);
    const res = mockRes();

    await updateMovie(mockReq({ params: { id: VALID_ID }, body: { title: "X" } }), res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("deleteMovie", () => {
  it("returns 404 for an invalid id without querying the DB", async () => {
    const res = mockRes();

    await deleteMovie(mockReq({ params: { id: INVALID_ID } }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(Movie.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("returns 404 when the movie does not exist", async () => {
    Movie.findByIdAndDelete.mockResolvedValue(null);
    const res = mockRes();

    await deleteMovie(mockReq({ params: { id: VALID_ID } }), res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 204 on successful delete", async () => {
    Movie.findByIdAndDelete.mockResolvedValue({ _id: VALID_ID });
    const res = mockRes();

    await deleteMovie(mockReq({ params: { id: VALID_ID } }), res);

    expect(Movie.findByIdAndDelete).toHaveBeenCalledWith(VALID_ID);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
