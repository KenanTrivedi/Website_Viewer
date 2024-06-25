const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
require("dotenv").config();

// Middleware for parsing JSON and serving static files
app.use(bodyParser.json());
app.use(express.static("docs"));

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schema and Model for Code
const codeSchema = new mongoose.Schema({ code: String });
const Code = mongoose.model("Code", codeSchema);

// Route for registering a new code
app.post("/register", async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).send("Code is required");
  }
  const newCode = new Code({ code });
  try {
    await newCode.save();
    res.status(201).send({ message: "Code saved", codeId: newCode._id });
  } catch (err) {
    console.error("Failed to save code:", err);
    res.status(500).send("Error saving code");
  }
});

// Route for login
app.post("/login", async (req, res) => {
  const { code } = req.body;
  try {
    const validCode = await Code.findOne({ code });
    if (validCode) {
      res.status(200).send({ message: "Login successful", code });
    } else {
      res.status(401).send("Invalid code");
    }
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).send("Error processing login request");
  }
});

// Route to serve the main page if no other route handles the HTTP request
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "docs", "index.html"));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
