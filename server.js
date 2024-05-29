const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("docs"));

// MongoDB connection
const mongoURI = process.env.MONGO_URI;
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("Failed to connect to MongoDB", error));

// Schema and Model
const userSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
});
const User = mongoose.model("User", userSchema);

// Routes
app.post("/register", async (req, res) => {
  try {
    const { code } = req.body;
    const newUser = new User({ code });
    await newUser.save();
    res.status(201).send("User registered");
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send("Error registering code");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findOne({ code });
    if (user) {
      res.status(200).send("Login successful");
    } else {
      res.status(401).send("Invalid code");
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Error during login");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
