const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.static("public")); // Serve static files

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const UserSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
});

const User = mongoose.model("User", UserSchema);

// Register new user
app.post("/register", async (req, res) => {
  const { code } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ code });
  if (userExists) {
    return res.status(400).json({ message: "Code already exists" });
  }

  // Create new user
  const newUser = new User({ code });
  await newUser.save();
  res.status(201).json({ message: "User created successfully" });
});

// Login user
app.post("/login", async (req, res) => {
  const { code } = req.body;

  // Check if user exists
  const user = await User.findOne({ code });
  if (!user) {
    return res.status(400).json({ message: "Invalid code" });
  }

  res.status(200).json({ message: "Login successful" });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running");
});
