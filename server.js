const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const csvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

// Middleware
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

// Schemas and Models
const codeSchema = new mongoose.Schema({ code: String });
const Code = mongoose.model("Code", codeSchema);

const userDataSchema = new mongoose.Schema({
  userId: String,
  data: Object,
});
const UserData = mongoose.model("UserData", userDataSchema);

// Constants
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const DASHBOARD_USER_ID = process.env.DASHBOARD_USER_ID || "admin";
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "password";

// Authentication Middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      req.userId = decoded.userId;
      next();
    });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}

// Routes
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

app.post("/api/save-user-data", async (req, res) => {
  const { userId, data } = req.body;
  try {
    await UserData.findOneAndUpdate(
      { userId },
      { $set: data },
      { upsert: true, new: true }
    );
    await updateCSV();
    res.status(200).send({ message: "Data saved successfully" });
  } catch (err) {
    console.error("Failed to save user data:", err);
    res.status(500).send("Error saving user data");
  }
});

app.get("/api/user-data/:userId", async (req, res) => {
  const { userId } = req.params;
  const userData = await UserData.findOne({ userId });
  if (userData) {
    res.status(200).json({ data: userData.data });
  } else {
    res.status(404).send("User data not found");
  }
});

app.post("/api/dashboard-login", async (req, res) => {
  const { userId, password } = req.body;
  if (userId === DASHBOARD_USER_ID && password === DASHBOARD_PASSWORD) {
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.resolve(__dirname, "docs", "dashboard.html"));
});

app.get("/dashboard-login", (req, res) => {
  res.sendFile(path.resolve(__dirname, "docs", "dashboard-login.html"));
});

app.get("/api/dashboard-data", authenticate, async (req, res) => {
  try {
    const users = await UserData.find().lean();
    const sections = surveyData
      .map((section) => section.title)
      .filter((title) => title !== "Persönliche Angaben");

    const formattedUsers = users.map((user) => ({
      userId: user.userId,
      gender: user.data.responses.q0_0, // Assuming this is the gender question
      birthYear: user.data.responses.q0_1, // Assuming this is the birth year question
      scores: sections.reduce((acc, section) => {
        acc[section] = user.data.categoryScores[section] || 0;
        return acc;
      }, {}),
    }));

    res.json({ users: formattedUsers, sections });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Error fetching dashboard data" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "docs", "index.html"));
});

// Helper Functions
async function updateCSV() {
  const allUserData = await UserData.find().lean();
  const surveyData = require("./docs/js/survey-data.js"); // Make sure this path is correct

  const csvWriter = createCsvWriter({
    path: "survey_data.csv",
    header: [
      { id: "userId", title: "User ID" },
      { id: "overallScore", title: "Overall Score" },
      ...surveyData.map((section) => ({
        id: section.title,
        title: section.title,
      })),
      ...surveyData.flatMap((section) =>
        section.questions.map((q, i) => ({
          id: `q${surveyData.indexOf(section)}_${i}`,
          title: q.text,
        }))
      ),
    ],
  });

  const records = allUserData.map((user) => {
    const record = {
      userId: user.userId,
      overallScore: user.data.overallScore,
      ...user.data.categoryScores,
    };
    Object.entries(user.data.responses).forEach(([key, value]) => {
      record[key] = value;
    });
    return record;
  });

  await csvWriter.writeRecords(records);
}

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
