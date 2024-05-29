const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

const userSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
});
const User = mongoose.model("User", userSchema);

app.post("/register", async (req, res) => {
  const { code } = req.body;
  try {
    const newUser = new User({ code });
    await newUser.save();
    res.status(201).send("Code registered successfully");
  } catch (err) {
    console.error("Error registering code:", err);
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
      res.status(400).send("Invalid code");
    }
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).send("Error logging in");
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
