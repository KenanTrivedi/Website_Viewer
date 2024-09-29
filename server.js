// server.js

// Import Required Modules
const express = require("express");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Initialize Express App
const app = express();

// Middleware Configuration
app.use(bodyParser.json());
app.use(express.static("docs")); // Serve static files from 'docs' directory

// MongoDB Connection
const mongoURI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/surveyDB"; // Use environment variable or default
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schemas and Models

// Code Schema and Model
const codeSchema = new mongoose.Schema({ code: String });
const Code = mongoose.model("Code", codeSchema, "codes");

// UserData Schema and Model
const userDataSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  data: { type: Object, default: {} },
  courses: { type: [String], default: [] },
  isComplete: { type: Boolean, default: false },
  firstSubmissionTime: { type: Date },
  latestSubmissionTime: { type: Date },
  initialScores: { type: Object, default: {} },
  updatedScores: { type: Object, default: {} },
  initialResponses: { type: Object, default: {} },
  updatedResponses: { type: Object, default: {} },
  datenschutzConsent: { type: Boolean, default: false }, // New Field: User Consent
  unterschrift: { type: String, default: "" }, // New Field: User Signature
});

const UserData = mongoose.model("UserData", userDataSchema, "userdatas");

// Constants
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const DASHBOARD_USER_ID = process.env.DASHBOARD_USER_ID || "admin";
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "password";

// Import survey data
const surveyData = require("./docs/js/survey-data.js");

// Authentication Middleware for Dashboard
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
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

/**
 * @route   POST /register
 * @desc    Register a new code for a user
 * @access  Public
 */
app.post("/register", async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: "Code is required" });
  }

  try {
    const existingCode = await Code.findOne({ code });
    if (existingCode) {
      return res.status(400).json({
        message:
          "Dieser Code existiert bereits. Bitte verwenden Sie stattdessen die Initialen Ihres Vaters für den zweiten Teil des Codes.",
        isDuplicateCode: true,
      });
    }

    const newCode = new Code({ code });
    await newCode.save();
    res.status(201).json({ message: "Code saved", userId: newCode._id });
  } catch (err) {
    console.error("Failed to save code:", err);
    res.status(500).json({ message: "Error saving code: " + err.message });
  }
});

/**
 * @route   POST /login
 * @desc    Handle user login
 * @access  Public
 */
app.post("/login", async (req, res) => {
  const { code, courses } = req.body;
  if (!code) {
    return res.status(400).json({ message: "Code ist erforderlich" });
  }

  try {
    const existingCode = await Code.findOne({ code });
    if (!existingCode) {
      return res.status(400).json({ message: "Ungültiger Code" });
    }

    let userData = await UserData.findOne({ userId: existingCode._id });

    if (!userData) {
      // New user
      userData = new UserData({
        userId: existingCode._id,
        data: { responses: {}, currentSection: 0 },
        courses: courses ? [courses] : [],
        firstSubmissionTime: new Date(),
        latestSubmissionTime: new Date(),
        initialScores: {},
        updatedScores: {},
        initialResponses: {},
        updatedResponses: {},
      });
      await userData.save();
    } else {
      // Existing user
      userData.latestSubmissionTime = new Date();
      if (courses && !userData.courses.includes(courses)) {
        userData.courses.push(courses);
      }
      await userData.save();
    }

    res.status(200).json({
      message: "Login erfolgreich",
      userId: existingCode._id,
      isNewUser: !userData.isComplete,
      courses: userData.courses,
      data: userData.data,
      initialScores: userData.initialScores,
      updatedScores: userData.updatedScores,
      initialResponses: userData.initialResponses,
      updatedResponses: userData.updatedResponses,
      datenschutzConsent: userData.datenschutzConsent, // Include Consent
      unterschrift: userData.unterschrift, // Include Signature
    });
  } catch (err) {
    console.error("Fehler beim Login:", err);
    res.status(500).json({
      message: "Fehler bei der Verarbeitung der Login-Anfrage",
      error: err.message,
    });
  }
});

/**
 * @route   POST /api/save-user-data
 * @desc    Save or update user survey data, including consent and signature
 * @access  Public
 */
app.post("/api/save-user-data", async (req, res) => {
  const {
    userId,
    data,
    isComplete,
    categoryScores,
    currentSection,
    datenschutzConsent,
    unterschrift,
  } = req.body;

  // Basic Input Validation
  if (!userId || !data) {
    return res
      .status(400)
      .json({ message: "Missing userId or data in request body." });
  }

  try {
    let userData = await UserData.findOne({ userId });
    const currentTime = new Date();

    if (!userData) {
      // First-time user (This should generally not happen if login creates the user)
      userData = new UserData({
        userId,
        data: data,
        courses: data.courses ? data.courses : [],
        isComplete: isComplete,
        firstSubmissionTime: currentTime,
        latestSubmissionTime: currentTime,
        initialScores: isComplete ? categoryScores : {},
        updatedScores: isComplete ? categoryScores : {},
        initialResponses: isComplete ? data.responses : {},
        updatedResponses: isComplete ? {} : data.responses,
        datenschutzConsent: datenschutzConsent || false,
        unterschrift: unterschrift || "",
      });
    } else {
      // Returning user
      userData.latestSubmissionTime = currentTime;
      userData.isComplete = isComplete || userData.isComplete;

      if (isComplete) {
        // Check if initialResponses are already set
        if (Object.keys(userData.initialResponses).length === 0) {
          // First Complete Submission
          userData.initialResponses = data.responses;
          userData.initialScores = categoryScores;
          console.log(`Initial scores set for userId: ${userId}`);
        } else {
          // Subsequent Complete Submissions
          userData.updatedResponses = data.responses;
          userData.updatedScores = categoryScores;
          console.log(`Updated scores set for userId: ${userId}`);
        }
      }

      // Update courses without duplicates
      if (data.courses && Array.isArray(data.courses)) {
        userData.courses = Array.from(
          new Set([...userData.courses, ...data.courses])
        );
      }

      // Update current section
      if (typeof currentSection === "number") {
        userData.data.currentSection = currentSection;
      }

      // Merge new responses
      userData.data.responses = {
        ...userData.data.responses,
        ...data.responses,
      };

      // Update Datenschutz Consent and Unterschrift if Provided
      if (typeof datenschutzConsent === "boolean") {
        userData.datenschutzConsent = datenschutzConsent;
      }

      if (typeof unterschrift === "string" && unterschrift.trim() !== "") {
        userData.unterschrift = unterschrift.trim();
      }
    }

    // Save to Database
    await userData.save();

    // Respond with Success and Relevant Data
    res.status(200).json({
      message: "User data saved successfully.",
      initialScores: userData.initialScores,
      updatedScores: userData.updatedScores,
      isComplete: userData.isComplete,
    });
  } catch (err) {
    console.error("Error saving user data:", err);
    // Handle Duplicate userId Error
    if (err.code === 11000) {
      return res.status(409).json({ message: "userId already exists." });
    }
    res
      .status(500)
      .json({ message: "Error saving user data", details: err.message });
  }
});
/**
 * @route   GET /api/user-data/:userId
 * @desc    Retrieve user survey data, including consent and signature
 * @access  Public
 */
app.get("/api/user-data/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const userData = await UserData.findOne({ userId });
    if (userData) {
      res.status(200).json({
        data: userData.data,
        courses: userData.courses,
        isComplete: userData.isComplete,
        initialScores: userData.initialScores,
        updatedScores: userData.updatedScores,
        initialResponses: userData.initialResponses,
        updatedResponses: userData.updatedResponses,
        datenschutzConsent: userData.datenschutzConsent, // Include Consent
        unterschrift: userData.unterschrift, // Include Signature
      });
    } else {
      res.status(404).json({ message: "User data not found" });
    }
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({ message: "Error fetching user data" });
  }
});

/**
 * @route   POST /api/dashboard-login
 * @desc    Handle dashboard login and provide JWT token
 * @access  Public
 */
app.post("/api/dashboard-login", (req, res) => {
  const { userId, password } = req.body;
  if (userId === DASHBOARD_USER_ID && password === DASHBOARD_PASSWORD) {
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

/**
 * @route   GET /dashboard
 * @desc    Serve the dashboard HTML page
 * @access  Public
 */
app.get("/dashboard", (req, res) => {
  res.sendFile(path.resolve(__dirname, "docs", "dashboard.html"));
});

/**
 * @route   GET /dashboard-login
 * @desc    Serve the dashboard login page
 * @access  Public
 */
app.get("/dashboard-login", (req, res) => {
  res.sendFile(path.resolve(__dirname, "docs", "dashboard-login.html"));
});

/**
 * @route   GET /api/dashboard-data
 * @desc    Retrieve all user data for the dashboard (Protected)
 * @access  Private
 */
app.get("/api/dashboard-data", authenticate, async (req, res) => {
  try {
    const users = await UserData.find().lean();

    const sections = surveyData
      .map((section) => section.title)
      .filter(
        (title) => title !== "Persönliche Angaben" && title !== "Abschluss"
      );

    const formattedUsers = await Promise.all(
      users.map(async (user) => {
        const codeDoc = await Code.findOne({ _id: user.userId });
        const responses = user.data.responses || {};

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
          isComplete: user.isComplete || false,
          courses: user.courses || [],
          initialScores: user.initialScores || {},
          updatedScores: user.updatedScores || {},
          initialResponses: user.initialResponses || {},
          updatedResponses: user.updatedResponses || {},
          datenschutzConsent: user.datenschutzConsent, // Include Consent
          unterschrift: user.unterschrift, // Include Signature
        };
      })
    );

    res.json({ users: formattedUsers, sections });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Error fetching dashboard data" });
  }
});

/**
 * @route   GET /*
 * @desc    Serve the default index page for all other routes
 * @access  Public
 */
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "docs", "index.html"));
});

// Helper Functions

/**
 * @function calculateCategoryScores
 * @desc    Calculate category scores based on survey responses
 * @param   {Object} responses - User responses
 * @param   {Array} surveyData - Survey data structure
 * @returns {Object} - Category scores as percentages
 */
function calculateCategoryScores(responses, surveyData) {
  const categoryScores = {};

  surveyData.forEach((section, sectionIndex) => {
    if (
      section.title !== "Persönliche Angaben" &&
      section.title !== "Abschluss"
    ) {
      let totalScore = 0;
      let questionCount = 0;

      section.questions.forEach((question, questionIndex) => {
        const questionId = `q${sectionIndex}_${questionIndex}`;
        if (responses[questionId] && question.type === "scale") {
          const parsedScore = parseInt(responses[questionId], 10);
          if (!isNaN(parsedScore)) {
            totalScore += parsedScore;
            questionCount++;
          }
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

/**
 * @function updateCSV
 * @desc    Update the CSV file with user survey data
 */
async function updateCSV() {
  const allUserData = await UserData.find().lean();

  const csvWriter = createCsvWriter({
    path: "survey_data.csv",
    header: [
      { id: "userId", title: "User ID" },
      { id: "userCode", title: "User Code" },
      { id: "gender", title: "Gender" },
      { id: "birthYear", title: "Birth Year" },
      { id: "firstSubmissionTime", title: "First Submission" },
      { id: "latestSubmissionTime", title: "Latest Submission" },
      { id: "courses", title: "Completed Courses" },
      ...surveyData.flatMap((section, sectionIndex) =>
        section.questions.map((q, questionIndex) => ({
          id: `q${sectionIndex}_${questionIndex}`,
          title: q.text,
        }))
      ),
      { id: "datum", title: "Datum" },
      { id: "unterschrift", title: "Unterschrift" },
    ],
  });

  const records = await Promise.all(
    allUserData.map(async (user) => {
      const codeDoc = await Code.findOne({ _id: user.userId });
      const responses = user.data.responses || {};

      return {
        userId: user.userId,
        userCode: codeDoc ? codeDoc.code : "Unknown",
        gender: responses.q0_0 || "",
        birthYear: responses.q0_1 || "",
        firstSubmissionTime: user.firstSubmissionTime,
        latestSubmissionTime: user.latestSubmissionTime,
        courses: user.courses ? user.courses.join(", ") : "",
        ...surveyData.reduce((acc, section, sectionIndex) => {
          section.questions.forEach((question, questionIndex) => {
            const questionId = `q${sectionIndex}_${questionIndex}`;
            let cellContent = "";

            if (
              user.initialResponses &&
              user.initialResponses[questionId] !== undefined
            ) {
              const initialResponse = user.initialResponses[questionId];
              const updatedResponse = user.updatedResponses
                ? user.updatedResponses[questionId]
                : undefined;

              if (updatedResponse !== undefined) {
                if (initialResponse === updatedResponse) {
                  cellContent = initialResponse;
                } else {
                  cellContent = `${initialResponse} → ${updatedResponse}`;
                }
              } else {
                cellContent = initialResponse;
              }
            } else if (user.updatedResponses) {
              cellContent = user.updatedResponses[questionId] || "";
            }

            acc[questionId] = cellContent;
          });
          return acc;
        }, {}),
        datum: user.datenschutzConsent
          ? new Date().toISOString().split("T")[0]
          : "",
        unterschrift: user.unterschrift || "",
      };
    })
  );

  try {
    await csvWriter.writeRecords(records);
    console.log("CSV file updated successfully");
  } catch (error) {
    console.error("Error updating CSV file:", error);
  }
}

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
