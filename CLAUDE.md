# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A minimal Node.js + Express 5 web server (CommonJS, `require` syntax). The entire app lives in `index.js`: it creates an Express app, defines routes, and listens on `process.env.PORT` (default `3000`).

## Commands

- Install dependencies: `npm install`
- Run the server: `npm start` (runs `node index.js`)
- Run on a different port: `PORT=4000 npm start`

There is no build step, linter, or test suite configured.

## Manual API testing

`requests.rest` holds HTTP requests for the VS Code REST Client extension (requests separated by `###`). Start the server first, then send requests from that file. Add new entries there when adding routes.

## Notes

- Express 5 is used (not 4): async route handlers that throw or reject are passed to the error handler automatically, and path-matching syntax differs from Express 4 (e.g. wildcards must be named, like `/*splat`).
