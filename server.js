const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static("docs"));

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB...", err));

const userSchema = new mongoose.Schema({
  code: String,
});

const User = mongoose.model("User", userSchema);

// Register route
app.post("/register", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).send("Code is required");

  let user = await User.findOne({ code });
  if (user) return res.status(400).send("Code already registered");

  user = new User({ code });
  await user.save();
  res.status(200).send({ message: "Code registered successfully" });
});

// Login route
app.post("/login", async (req, res) => {
  const { code } = req.body;
  const user = await User.findOne({ code });
  if (!user) return res.status(400).send("Invalid code");

  res.status(200).send({ message: "Login successful" });
});

app.get("*", (req, res) => {
  res.sendFile(__dirname + "/docs/index.html");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/codes", async (req, res) => {
  try {
    const codes = await User.find().select("code -_id"); // Fetch all codes, excluding MongoDB _id field
    res.status(200).send(codes);
  } catch (err) {
    res.status(500).send("Server error");
  }
});
