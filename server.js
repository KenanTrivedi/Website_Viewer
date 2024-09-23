const express = require("express");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
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
const Code = mongoose.model("Code", codeSchema, "codes");

const userDataSchema = new mongoose.Schema({
  userId: String,
  data: Object,
  courses: { type: Array, default: [] },
  isComplete: { type: Boolean, default: false },
  firstSubmissionTime: { type: Date },
  latestSubmissionTime: { type: Date },
  initialScores: { type: Object, default: {} },
  updatedScores: { type: Object, default: {} },
});
const UserData = mongoose.model("UserData", userDataSchema, "userdatas");

// Constants
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const DASHBOARD_USER_ID = process.env.DASHBOARD_USER_ID || "admin";
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "password";

// Import survey data
const surveyData = require("./docs/js/survey-data.js");

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

// Register a new code for a user
app.post("/register", async (req, res) => {
  const { code } = req.body;
  const newCode = new Code({ code });
  try {
    await newCode.save();
    res.status(201).send({ message: "Code saved", userId: newCode._id });
  } catch (err) {
    console.error("Failed to save code:", err);
    res.status(500).send("Error saving code");
  }
});

// Login route - to handle both "Nein" and "Ja" flows
app.post("/login", async (req, res) => {
  const { code, courses } = req.body;
  try {
    // Find or create a user by code
    let user = await Code.findOne({ code });

    if (!user) {
      return res.status(400).json({ message: "Invalid code" });
    }

    // Ensure user data exists in the database
    const userData = await UserData.findOneAndUpdate(
      { userId: user._id },
      {
        $setOnInsert: {
          userId: user._id,
          data: {},
          firstSubmissionTime: new Date(),
        },
        $set: {
          latestSubmissionTime: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // Update the user's courses if provided
    if (courses) {
      await UserData.updateOne({ userId: user._id }, { $set: { courses } });
    }

    // Send userId back to client
    res.status(200).json({ message: "Login successful", userId: user._id });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Error processing login request" });
  }
});

// Save user survey data
app.post("/api/save-user-data", async (req, res) => {
  const { userId, data, isComplete, categoryScores } = req.body;
  try {
    if (!userId || !data) {
      return res.status(400).json({ message: "Missing userId or data" });
    }

    const currentTime = new Date();

    let userData = await UserData.findOne({ userId });

    if (!userData) {
      // First time submission
      userData = new UserData({
        userId,
        data: { responses: data.responses },
        isComplete: isComplete || false,
        firstSubmissionTime: currentTime,
        latestSubmissionTime: currentTime,
        initialScores: categoryScores,
        updatedScores: categoryScores,
      });
    } else {
      // Subsequent submission
      userData.data.responses = data.responses;
      userData.isComplete = isComplete || false;
      userData.latestSubmissionTime = currentTime;
      userData.updatedScores = categoryScores;

      // Only update initialScores if it's empty
      if (Object.keys(userData.initialScores).length === 0) {
        userData.initialScores = categoryScores;
      }
    }

    await userData.save();

    res.status(200).json({
      message: "Data saved successfully",
      initialScores: userData.initialScores,
      updatedScores: userData.updatedScores,
    });
  } catch (err) {
    console.error("Error saving user data:", err);
    res
      .status(500)
      .json({ message: "Error saving user data", details: err.message });
  }
});

// Get user data by userId
app.get("/api/user-data/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const userData = await UserData.findOne({ userId });
    if (userData) {
      res.status(200).json({
        data: userData.data,
        isComplete: userData.isComplete,
        initialScores: userData.initialScores,
        updatedScores: userData.updatedScores,
      });
    } else {
      res.status(200).json({
        data: { responses: {} },
        isComplete: false,
        initialScores: {},
        updatedScores: {},
      });
    }
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({ message: "Error fetching user data" });
  }
});

// Login to dashboard
app.post("/api/dashboard-login", async (req, res) => {
  const { userId, password } = req.body;
  if (userId === DASHBOARD_USER_ID && password === DASHBOARD_PASSWORD) {
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Serve the dashboard HTML page
app.get("/dashboard", (req, res) => {
  res.sendFile(path.resolve(__dirname, "docs", "dashboard.html"));
});

// Serve the dashboard login page
app.get("/dashboard-login", (req, res) => {
  res.sendFile(path.resolve(__dirname, "docs", "dashboard-login.html"));
});

// Get data for the dashboard
app.get("/api/dashboard-data", authenticate, async (req, res) => {
  try {
    const users = await UserData.find().lean();
    console.log("Found users:", users.length);

    const sections = surveyData
      .map((section) => section.title)
      .filter((title) => title !== "Persönliche Angaben");

    const formattedUsers = await Promise.all(
      users.map(async (user) => {
        const codeDoc = await Code.findOne({ _id: user.userId });
        const responses = user.data.responses || {};
        const categoryScores = calculateCategoryScores(responses, surveyData);

        return {
          userId: user.userId,
          userCode: codeDoc ? codeDoc.code : "Unknown",
          gender: responses.q0_0 || "",
          birthYear: responses.q0_1 || "",
          firstSubmissionTime: user.firstSubmissionTime
            ? user.firstSubmissionTime.toISOString()
            : "",
          latestSubmissionTime: user.latestSubmissionTime
            ? user.latestSubmissionTime.toISOString()
            : "",
          data: {
            responses: responses,
          },
          scores: categoryScores,
          isComplete: user.isComplete || false,
        };
      })
    );

    res.json({ users: formattedUsers, sections });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Error fetching dashboard data" });
  }
});

// Serve the default index page for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "docs", "index.html"));
});

// Helper Functions

// Calculate category scores based on survey responses
function calculateCategoryScores(responses, surveyData) {
  const categoryScores = {};

  surveyData.forEach((section, sectionIndex) => {
    if (section.title !== "Persönliche Angaben") {
      let totalScore = 0;
      let questionCount = 0;

      section.questions.forEach((question, questionIndex) => {
        const questionId = `q${sectionIndex}_${questionIndex}`;
        if (responses[questionId] && question.type === "scale") {
          totalScore += parseInt(responses[questionId]);
          questionCount++;
        }
      });

      if (questionCount > 0) {
        categoryScores[section.title] = Math.round(
          (totalScore / (questionCount * 6)) * 100
        );
      } else {
        categoryScores[section.title] = 0;
      }
    }
  });

  return categoryScores;
}

// Function to update the CSV file with user survey data
async function updateCSV() {
  const allUserData = await UserData.find().lean();

  const csvWriter = createCsvWriter({
    path: "survey_data.csv",
    header: [
      { id: "userId", title: "User ID" },
      { id: "gender", title: "Gender" },
      { id: "birthYear", title: "Birth Year" },
      { id: "firstSubmissionTime", title: "First Submission" },
      { id: "latestSubmissionTime", title: "Latest Submission" },
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
      gender: user.data.responses.q0_0,
      birthYear: user.data.responses.q0_1,
      firstSubmissionTime: user.firstSubmissionTime,
      latestSubmissionTime: user.latestSubmissionTime,
    };
    Object.entries(user.data.responses).forEach(([key, value]) => {
      if (key !== "q0_0" && key !== "q0_1") {
        record[key] = value;
      }
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
