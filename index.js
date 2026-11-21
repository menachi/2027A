const express = require("express");
const mongoose = require("mongoose");
const moviesRouter = require("./routes/movies.routes");

const app = express();
const port = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/movie-reviews";

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

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`Connected to MongoDB at ${MONGO_URI}`);
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
