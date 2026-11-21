# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A Node.js + Express 5 REST API for a movie review system (CommonJS, `require` syntax). Data is stored in MongoDB through Mongoose. So far only the movie resource exists; reviews are not built yet.

- `index.js`: sets up the app (`express.json()`), mounts the routers (`/movies`), and adds a central error handler (Mongoose `ValidationError` → 400, anything else → 500). It connects to MongoDB **before** calling `listen`, and exits if the connection fails.
- `routes/<resource>.routes.js`: an `express.Router()` that maps HTTP verbs and paths to controller functions, with no logic of its own.
- `controllers/<resource>.controller.js`: `async` handlers that call the model. They use no try/catch, because Express 5 forwards rejected promises to the error handler. Ids that are not valid ObjectIds are checked with `mongoose.isValidObjectId` and return 404, which avoids a CastError → 500.
- `models/<resource>.model.js`: the Mongoose schema. Validation rules (such as the required `title`) live here, not in the controllers.

New resources (such as reviews) should follow the same route → controller → model split.

## Configuration

- MongoDB must be running locally. The connection string is `process.env.MONGO_URI`, with the default `mongodb://localhost:27017/movie-reviews`.
- `PORT`: default `3000`.

## Commands

- Install dependencies: `npm install`
- Run the server: `npm start` (runs `node index.js`)
- Run on a different port or database: `PORT=4000 MONGO_URI=mongodb://localhost:27017/other-db npm start`

There is no build step, linter, or test suite configured.

## Manual API testing

`requests.rest` holds HTTP requests for the VS Code REST Client extension (requests separated by `###`). Run the "Create a movie" request first: later requests reuse its `_id` through `{{createMovie.response.body._id}}`. Start the server first, then send requests from that file. Add new entries there when adding routes.

## Notes

- Express 5 is used (not 4): async route handlers that throw or reject are passed to the error handler automatically, and path-matching syntax differs from Express 4 (e.g. wildcards must be named, like `/*splat`).
