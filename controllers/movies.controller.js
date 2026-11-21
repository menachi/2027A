const mongoose = require("mongoose");
const Movie = require("../models/movie.model");

const notFound = (res) => res.status(404).json({ error: "Movie not found" });

const pickMovieFields = (body = {}) => {
  const { title, year, director, genre, description } = body;
  return { title, year, director, genre, description };
};

const getAllMovies = async (req, res) => {
  const { year } = req.query;
  const filter = {};
  if (year !== undefined) {
    const yearNum = Number(year);
    if (Number.isNaN(yearNum)) {
      return res.status(400).json({ error: "year must be a number" });
    }
    filter.year = yearNum;
  }
  const movies = await Movie.find(filter);
  res.json(movies);
};

const getMovieById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return notFound(res);
  const movie = await Movie.findById(id);
  if (!movie) return notFound(res);
  res.json(movie);
};

const createMovie = async (req, res) => {
  const movie = await Movie.create(pickMovieFields(req.body));
  res.status(201).json(movie);
};

const updateMovie = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return notFound(res);
  // Full replacement of the movie fields: set what was sent, unset what was omitted
  // (an update instead of a replace keeps createdAt intact).
  const $set = {};
  const $unset = {};
  for (const [key, value] of Object.entries(pickMovieFields(req.body))) {
    if (value === undefined) $unset[key] = "";
    else $set[key] = value;
  }
  const movie = await Movie.findByIdAndUpdate(
    id,
    { $set, $unset },
    { returnDocument: "after", runValidators: true }
  );
  if (!movie) return notFound(res);
  res.json(movie);
};

const deleteMovie = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return notFound(res);
  const movie = await Movie.findByIdAndDelete(id);
  if (!movie) return notFound(res);
  res.status(204).send();
};

module.exports = {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
};
