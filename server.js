const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("docs"));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
  });

// Define a simple schema for storing codes
const codeSchema = new mongoose.Schema({
  code: String,
});

const Code = mongoose.model("Code", codeSchema);

// Route to register a code
app.post("/register", async (req, res) => {
  const { code } = req.body;
  try {
    const newCode = new Code({ code });
    await newCode.save();
    res.status(200).send("Code registered successfully");
  } catch (error) {
    console.error("Error registering code:", error);
    res.status(500).send("Error registering code");
  }
});

// Route to login with a code
app.post("/login", async (req, res) => {
  const { code } = req.body;
  try {
    const foundCode = await Code.findOne({ code });
    if (foundCode) {
      res.status(200).send("Login successful");
    } else {
      res.status(401).send("Invalid code");
    }
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Error logging in");
  }
});
