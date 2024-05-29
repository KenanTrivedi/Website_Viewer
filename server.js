require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static("public"));

const mongoUri = process.env.MONGODB_URI;
mongoose
  .connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB...", err));

// Example schema and model
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
