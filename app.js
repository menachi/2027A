const express = require("express");
const moviesRouter = require("./routes/movies.routes");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, World! 3333");
});

app.use("/movies", moviesRouter);

// Error handler (Express 5 forwards rejected async handlers here)
app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
