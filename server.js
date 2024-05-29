const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("docs"));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Could not connect to MongoDB...", err);
  });

// Define a schema and model for user codes
const userSchema = new mongoose.Schema({
  code: String,
});

const User = mongoose.model("User", userSchema);

// Register route
app.post("/register", async (req, res) => {
  const { code } = req.body;

  try {
    let user = await User.findOne({ code });

    if (!user) {
      user = new User({ code });
      await user.save();
    }

    res.status(200).send("Code registered successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error registering code");
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { code } = req.body;

  try {
    const user = await User.findOne({ code });

    if (user) {
      res.status(200).send("Login successful");
    } else {
      res.status(400).send("Invalid code");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error logging in");
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
