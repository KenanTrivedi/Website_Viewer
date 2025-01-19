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

// Set Mongoose options
mongoose.set('strictQuery', false); // Handle Mongoose 7 deprecation warning

// Middleware Configuration
app.use(bodyParser.json());
app.use(express.static("docs")); // Serve static files from 'docs' directory

// MongoDB Connection
const mongoURI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/surveyDB"; // Use environment variable or default
mongoose
  .connect(mongoURI)
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
  updatedScores2: { type: Object, default: {} },
  initialResponses: { type: Object, default: {} },
  updatedResponses: { type: Object, default: {} },
  updatedResponses2: { type: Object, default: {} },
  T2History: { type: [Object], default: [] },
  T3History: { type: [Object], default: [] },
  T2AttemptCount: { type: Number, default: 0 },
  T3AttemptCount: { type: Number, default: 0 },
  currentSection: { type: Number, default: -1 },
  datenschutzConsent: { type: Boolean, default: false },
  unterschrift: { type: String, default: "" },
  attemptNumber: { type: Number, default: 1 },
  openEndedResponses: { type: Object, default: {} }
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
 * @route   POST /api/reset-user-data
 * @desc    Reset survey responses for a user (excluding personal details)
 * @access  Public
 */
app.post("/api/reset-user-data", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "userId is required." });
  }
  try {
    const userData = await UserData.findOne({ userId });
    if (!userData) {
      return res.status(404).json({ message: "User not found." });
    }
    // Preserve personal information including new fields
    const personalInfo = {
      q0_0: userData.data.q0_0,  // Gender
      q0_1: userData.data.q0_1,  // Birth Year
      q0_2: userData.data.q0_2,  // Is Teaching Student
      q0_3: userData.data.q0_3,  // Teaching Type (if applicable)
      q0_4: userData.data.q0_4,  // Teaching Subjects (if applicable)
      q0_5: userData.data.q0_5,  // Non-teaching Subjects (if applicable)
      q0_6: userData.data.q0_6   // Current Semester
    };

    userData.data = personalInfo;
    userData.updatedResponses = {};
    userData.updatedResponses2 = {}; // Reset T3 responses
    userData.updatedScores = {};
    userData.isComplete = false;
    userData.currentSection = 0;
    await userData.save();
    res.status(200).json({ message: "Survey data reset successfully." });
  } catch (error) {
    console.error("Error resetting user data:", error);
    res.status(500).json({ message: "Error resetting user data." });
  }
});

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
 * @desc    Handle user login with three options
 * @access  Public
 */
app.post("/login", async (req, res) => {
  const { code, courses, startNewAttempt, desiredAttempt } = req.body;
  try {
    const existingCode = await Code.findOne({ code: code.toUpperCase() });
    if (!existingCode) {
      return res.status(400).json({ message: "Invalid code" });
    }

    let userData = await UserData.findOne({ userId: existingCode._id });
    
    if (startNewAttempt) {
      if (desiredAttempt === 2) {
        // 1) push the old updatedResponses to T2History
        if (Object.keys(userData.updatedResponses || {}).length > 0) {
          userData.T2History.push(userData.updatedResponses);
        }

        // 2) increment T2AttemptCount
        userData.T2AttemptCount = (userData.T2AttemptCount || 0) + 1;

        // 3) clear updatedResponses
        userData.updatedResponses = {};

        // 4) preserve personal info, set everything else the same
        userData.data = {
          q0_0: userData.data.q0_0,
          q0_1: userData.data.q0_1,
          q0_2: userData.data.q0_2,
          q0_3: userData.data.q0_3
        };
        userData.isComplete = false;
        userData.currentSection = 0;
      } else if (desiredAttempt === 3) {
        // Check if T2 is completed
        if (!userData || userData.attemptNumber < 2) {
          return res.status(400).json({ message: "Must complete T2 before starting T3" });
        }

        // 1) push old updatedResponses2 to T3History
        if (Object.keys(userData.updatedResponses2 || {}).length > 0) {
          userData.T3History.push(userData.updatedResponses2);
        }

        // 2) increment T3AttemptCount
        userData.T3AttemptCount = (userData.T3AttemptCount || 0) + 1;

        // 3) clear updatedResponses2
        userData.updatedResponses2 = {};

        // 4) preserve personal info, set everything else the same
        userData.data = {
          q0_0: userData.data.q0_0,
          q0_1: userData.data.q0_1,
          q0_2: userData.data.q0_2,
          q0_3: userData.data.q0_3
        };
        userData.isComplete = false;
        userData.currentSection = 0;
      }

      // 5) Save
      userData.attemptNumber = desiredAttempt;
      await userData.save();
    }

    res.json({
      userId: userData.userId,
      attemptNumber: userData.attemptNumber,
      T2AttemptCount: userData.T2AttemptCount || 0,
      T3AttemptCount: userData.T3AttemptCount || 0,
      courses: userData.courses
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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
    openEndedResponses,
    personalInfo,
    isPersonalInfo,
  } = req.body;

  if (!userId) {
    return res.status(400).json({
      message: "Missing userId in request body.",
      success: false,
    });
  }

  try {
    let userData = await UserData.findOne({ userId });
    const currentTime = new Date();

    if (!userData) {
      userData = new UserData({
        userId,
        data: isPersonalInfo ? personalInfo : {},
        courses: [],
        isComplete: false,
        firstSubmissionTime: currentTime,
        latestSubmissionTime: currentTime,
        initialScores: {},
        updatedScores: {},
        initialResponses: {},
        updatedResponses: {},
        updatedResponses2: {}, // Initialize T3 responses
        currentSection: -1,
        datenschutzConsent: false,
        unterschrift: "",
        attemptNumber: 1,
        openEndedResponses: {},
      });
    }

    // Update timestamps
    if (!userData.firstSubmissionTime) {
      userData.firstSubmissionTime = currentTime;
    }
    userData.latestSubmissionTime = currentTime;

    // Handle data updates based on section
    if (isPersonalInfo && personalInfo) {
      userData.data = {
        ...userData.data,
        ...personalInfo,
      };
    } else if (data) {
      userData.data = {
        ...userData.data,
        ...data,
      };
    }

    // Update other fields if provided
    if (typeof isComplete !== 'undefined') userData.isComplete = isComplete;
    if (typeof currentSection !== 'undefined') userData.currentSection = currentSection;
    if (typeof datenschutzConsent !== 'undefined') userData.datenschutzConsent = datenschutzConsent;
    if (unterschrift) userData.unterschrift = unterschrift;
    if (openEndedResponses) userData.openEndedResponses = openEndedResponses;

    // Save the updated user data
    await userData.save();

    res.status(200).json({
      message: "Data saved successfully",
      success: true,
      userData: {
        data: userData.data,
        currentSection: userData.currentSection,
        isComplete: userData.isComplete,
        datenschutzConsent: userData.datenschutzConsent,
      },
    });
  } catch (err) {
    console.error("Error saving user data:", err);
    res.status(500).json({
      message: "Error saving user data",
      error: err.message,
      success: false,
    });
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
    let userData = await UserData.findOne({ userId });
    
    if (!userData) {
      // Initialize new user data if not found
      userData = new UserData({
        userId,
        data: {},
        courses: [],
        isComplete: false,
        firstSubmissionTime: new Date(),
        latestSubmissionTime: new Date(),
        initialScores: {},
        updatedScores: {},
        initialResponses: {},
        updatedResponses: {},
        updatedResponses2: {}, // Initialize T3 responses
        currentSection: -1, // Start with datenschutz
        datenschutzConsent: false,
        unterschrift: "",
        attemptNumber: 1,
        openEndedResponses: {},
      });
      await userData.save();
    }
    
    res.status(200).json({
      data: userData.data || {},
      courses: userData.courses || [],
      isComplete: userData.isComplete || false,
      initialScores: userData.initialScores || {},
      updatedScores: userData.updatedScores || {},
      initialResponses: userData.initialResponses || {},
      updatedResponses: userData.updatedResponses || {},
      updatedResponses2: userData.updatedResponses2 || {}, // Include T3 responses
      currentSection: userData.currentSection ?? -1,
      datenschutzConsent: userData.datenschutzConsent || false,
      unterschrift: userData.unterschrift || "",
      attemptNumber: userData.attemptNumber || 1,
      openEndedResponses: userData.openEndedResponses || {},
    });
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({ message: "Error fetching user data", error: err.message });
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

    const formattedUsers = users.map(user => ({
      userId: user.userId,
      code: user.code,
      firstSubmissionTime: user.firstSubmissionTime,
      latestSubmissionTime: user.latestSubmissionTime,
      t2AttemptCount: user.T2AttemptCount || 0,
      t3AttemptCount: user.T3AttemptCount || 0,
      // Latest responses in standard fields
      updatedResponses: user.updatedResponses || {},  // latest T2
      updatedResponses2: user.updatedResponses2 || {}, // latest T3
      // History available but not used in main display
      T2History: user.T2History || [],
      T3History: user.T3History || []
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

/**
 * @route   GET /api/results/:userId
 * @desc    Get user's T1, T2, and T3 scores
 * @access  Public
 */
app.get("/api/results/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await UserData.findOne({ userId });
    
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      userData: {
        initialScores: userData.initialScores || {},
        updatedScores: userData.updatedScores || {},
        updatedScores2: userData.updatedScores2 || {},
        attemptNumber: userData.attemptNumber || 1
      }
    });
  } catch (err) {
    console.error("Error fetching user results:", err);
    res.status(500).json({ message: "Error fetching user results", error: err.message });
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
 * @desc    Calculate category scores based on survey responses for both T1 and T2
 * @param   {Object} responses - User responses
 * @param   {Array} surveyData - Survey data structure
 * @returns {Object} - Category scores as percentages for both T1 and T2
 */
function calculateCategoryScores(responses, surveyData) {
  // Create an object to store all attempts
  const categoryScores = {
    t1: {}, // Initial responses
    latest: {}, // Latest responses (t2, t3, etc.)
  };

  surveyData.forEach((section, sectionIndex) => {
    if (
      section.title !== "Persönliche Angaben" &&
      section.title !== "Abschluss"
    ) {
      let t1TotalScore = 0;
      let latestTotalScore = 0;
      let questionCount = 0;

      section.questions.forEach((question, questionIndex) => {
        const questionId = `q${sectionIndex}_${questionIndex}`;

        if (question.type === "scale") {
          questionCount++;

          // Calculate T1 score (never changes)
          if (responses.initialResponses?.[questionId]) {
            const t1Score = parseInt(
              responses.initialResponses[questionId],
              10
            );
            if (!isNaN(t1Score)) {
              t1TotalScore += t1Score;
            }
          }

          // Calculate latest score
          if (responses.updatedResponses?.[questionId]) {
            const latestScore = parseInt(
              responses.updatedResponses[questionId],
              10
            );
            if (!isNaN(latestScore)) {
              latestTotalScore += latestScore;
            }
          }
        }
      });

      if (questionCount > 0) {
        const maxPossibleScore = questionCount * 6;

        // Calculate T1 percentage (never changes)
        categoryScores.t1[section.title] = Math.round(
          (t1TotalScore / maxPossibleScore) * 100
        );

        // Calculate latest percentage
        categoryScores.latest[section.title] = Math.round(
          (latestTotalScore / maxPossibleScore) * 100
        );
      }
    }
  });

  // Calculate overall scores
  const calculateOverallScore = (scores) => {
    const categories = Object.values(scores);
    if (categories.length === 0) return 0;
    const total = categories.reduce((sum, score) => sum + score, 0);
    return Math.round(total / categories.length);
  };

  categoryScores.t1.overall = calculateOverallScore(categoryScores.t1);
  categoryScores.latest.overall = calculateOverallScore(categoryScores.latest);

  // Add metadata about current attempt number
  categoryScores.metadata = {
    maxScorePerQuestion: 6,
    scoreType: "percentage",
    t1Label: "Initial Assessment",
    latestLabel: `Attempt ${responses.attemptNumber || 1}`,
    categories: Object.keys(categoryScores.t1).filter(
      (key) => key !== "overall"
    ),
  };

  return categoryScores;
}

/**
 * @function updateCSV
 * @desc    Update the CSV file with user survey data
 */
async function updateCSV() {
  const allUserData = await UserData.find().lean();

  // Create headers including attempt number
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
      { id: "courseFeedback", title: "Feedback zu Kursen" },
      { id: "strategy", title: "Strategie bei der Auswahl" },
      { id: "reflection", title: "Veränderung der Kompetenzüberzeugungen" },
      { id: "attemptNumber", title: "Attempt Number" },
      // Create t1 and latest attempt columns for each question
      ...surveyData
        .flatMap((section, sectionIndex) =>
          section.questions.flatMap((q, questionIndex) => {
            if (sectionIndex === 0) return []; // Skip personal info questions
            const qId = `q${sectionIndex}_${questionIndex}`;
            return [
              { id: `${qId}_t1`, title: `${qId} (T1)` },
              {
                id: `${qId}_latest`,
                title: `${qId} (T${allUserData.attemptNumber || 2})`,
              },
            ];
          })
        )
        .filter((header) => header),
    ],
  });

  const records = await Promise.all(
    allUserData.map(async (user) => {
      const codeDoc = await Code.findOne({ _id: user.userId });

      const baseRecord = {
        userId: user.userId,
        userCode: codeDoc ? codeDoc.code : "Unknown",
        gender: user.data?.q0_0 || "",
        birthYear: user.data?.q0_1 || "",
        firstSubmissionTime: user.firstSubmissionTime
          ? new Date(user.firstSubmissionTime).toLocaleString()
          : "",
        latestSubmissionTime: user.latestSubmissionTime
          ? new Date(user.latestSubmissionTime).toLocaleString()
          : "",
        courses: user.courses?.join(", ") || "",
        courseFeedback: user.openEndedResponses?.attempt2_course_feedback || "",
        strategy: user.openEndedResponses?.t1_strategy || "",
        reflection: user.openEndedResponses?.t2_reflection || "",
        attemptNumber: user.attemptNumber || 1,
      };

      // Add question responses for both T1 and latest attempt
      surveyData.forEach((section, sectionIndex) => {
        if (sectionIndex === 0) return; // Skip personal info section

        section.questions.forEach((question, questionIndex) => {
          const qId = `q${sectionIndex}_${questionIndex}`;

          // Get T1 response from initialResponses (never changes)
          baseRecord[`${qId}_t1`] = user.initialResponses?.[qId] || "";

          // Get latest response from updatedResponses
          baseRecord[`${qId}_latest`] = user.updatedResponses?.[qId] || "";
        });
      });

      return baseRecord;
    })
  );

  try {
    await csvWriter.writeRecords(records);
    console.log(`CSV file updated successfully with ${records.length} records`);
  } catch (error) {
    console.error("Error updating CSV file:", error);
    throw new Error(`Failed to write CSV file: ${error.message}`);
  }
}

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/**
 * @route   POST /api/save-open-ended-response
 * @desc    Save user's open-ended responses with specific keys
 * @access  Public
 */
app.post("/api/save-open-ended-response", async (req, res) => {
  const { userId, key, response } = req.body;

  if (!userId || !response || !key) {
    return res.status(400).json({
      message: "Missing userId, response, or key in request body.",
    });
  }

  try {
    const objectId = new mongoose.Types.ObjectId(userId);
    let userData = await UserData.findOne({ userId: objectId });
    if (!userData) {
      return res.status(404).json({ message: "User data not found." });
    }

    if (!userData.openEndedResponses) {
      userData.openEndedResponses = {};
    }

    userData.openEndedResponses[key] = response;
    await userData.save();

    res
      .status(200)
      .json({ message: "Open-ended response saved successfully." });
  } catch (err) {
    console.error("Error saving open-ended response:", err);
    res.status(500).json({
      message: "Error saving open-ended response",
      details: err.message,
    });
  }
});
