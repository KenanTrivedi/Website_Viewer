const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("docs"));

// MongoDB connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectToMongo() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }
}

connectToMongo();

// Define a schema and model for storing user codes
const userSchema = new mongoose.Schema({
  code: String,
});

const User = mongoose.model("User", userSchema);

// Routes
app.post("/register", async (req, res) => {
  const { code } = req.body;
  try {
    const newUser = new User({ code });
    await newUser.save();
    res.status(201).send("Code registered successfully");
  } catch (error) {
    res.status(500).send("Error registering code");
  }
});

app.post("/login", async (req, res) => {
  const { code } = req.body;
  try {
    const user = await User.findOne({ code });
    if (user) {
      res.status(200).send("Login successful");
    } else {
      res.status(401).send("Invalid code");
    }
  } catch (error) {
    res.status(500).send("Error logging in");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
