# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A Node.js + Express 5 REST API for a movie review system (CommonJS, `require` syntax). Data is stored in MongoDB through Mongoose. So far only the movie resource exists; reviews are not built yet.

- `app.js`: builds and exports the Express app (`express.json()`), mounts the routers (`/movies`), and adds a central error handler (Mongoose `ValidationError` → 400, anything else → 500). It does not connect or listen, so tests can import it.
- `index.js`: the entry point. It connects to MongoDB **before** calling `app.listen`, and exits if the connection fails.
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

- Run all tests: `npm test` (Jest)
- Unit tests only: `npm run test:unit`. These live in `tests/unit/`, mock the Mongoose model with `jest.mock`, and need no DB.
- E2E tests only: `npm run test:e2e`. These live in `tests/e2e/`, use Supertest against `app.js`, and need local MongoDB running. They use the `movie-reviews-test` DB (override with `MONGO_URI_TEST`), which is cleared before each test and dropped at the end.
- Run a single test file: `npx jest tests/unit/movies.controller.test.js`, or filter by name with `-t "<name>"`

There is no build step or linter.

## Manual API testing

`requests.rest` holds HTTP requests for the VS Code REST Client extension (requests separated by `###`). Run the "Create a movie" request first: later requests reuse its `_id` through `{{createMovie.response.body._id}}`. Start the server first, then send requests from that file. Add new entries there when adding routes.

## Notes

- E2E tests connect with `runtimeAdapters: { os: require("os") }`. MongoDB driver 7.8 loads `os` via dynamic `import()`, which Jest's VM sandbox doesn't support. Without this option the connection fails with "Missing required sub-document 'driver'".
- Express 5 is used (not 4): async route handlers that throw or reject are passed to the error handler automatically, and path-matching syntax differs from Express 4 (e.g. wildcards must be named, like `/*splat`).
