const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
const mongoURI = process.env.MONGO_URI;
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

// Mongoose schema and model for user codes
const codeSchema = new mongoose.Schema({
  code: String,
});

const Code = mongoose.model("Code", codeSchema);

// Routes
app.post("/register", async (req, res) => {
  const { code } = req.body;
  try {
    const newCode = new Code({ code });
    await newCode.save();
    res.status(201).send("Code registered successfully");
  } catch (error) {
    res.status(500).send("Error registering code");
  }
});

app.post("/login", async (req, res) => {
  const { code } = req.body;
  try {
    const existingCode = await Code.findOne({ code });
    if (existingCode) {
      res.status(200).send("Login successful");
    } else {
      res.status(401).send("Invalid code");
    }
  } catch (error) {
    res.status(500).send("Error logging in");
  }
});

app.use(express.static("docs"));

app.get("*", (req, res) => {
  res.sendFile(__dirname + "/docs/index.html");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
