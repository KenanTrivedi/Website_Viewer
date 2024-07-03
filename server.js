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

// Schema and Model for User Data
const userDataSchema = new mongoose.Schema({
  userId: String,
  data: Object,
});
const UserData = mongoose.model("UserData", userDataSchema);

// Route for registering a new code
app.post("/register", async (req, res) => {
  const { code } = req.body;
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
      res
        .status(200)
        .send({ message: "Login successful", userId: validCode._id });
    } else {
      res.status(401).send("Invalid code");
    }
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).send("Error processing login request");
  }
});

// Route for saving user data
app.post("/api/save-user-data", async (req, res) => {
  const { userId, data } = req.body;
  try {
    await UserData.findOneAndUpdate(
      { userId },
      { data },
      { upsert: true, new: true }
    );
    res.status(200).send({ message: "Data saved successfully" });
  } catch (err) {
    console.error("Failed to save user data:", err);
    res.status(500).send("Error saving user data");
  }
});

// Route for loading user data
app.get("/api/user-data/:userId", async (req, res) => {
  const { userId } = req.params;
  const userData = await UserData.findOne({ userId });
  if (userData) {
    res.status(200).json({ data: userData.data });
  } else {
    res.status(404).send("User data not found");
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

app.post("/survey", async (req, res) => {
  const { userId, surveyData } = req.body;
  // Assume `SurveyResponse` is a model connected to your database
  try {
    const newSurvey = new SurveyResponse({ userId, surveyData });
    await newSurvey.save();
    res
      .status(201)
      .send({ message: "Survey data saved successfully", data: newSurvey });
  } catch (error) {
    console.error("Error saving survey data:", error);
    res.status(500).send({ message: "Failed to save survey data" });
  }
});
