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
    // useCreateIndex: true, // No longer necessary in newer Mongoose versions
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
  currentSection: { type: Number, default: 0 },
  datenschutzConsent: { type: Boolean, default: false },
  unterschrift: { type: String, default: "" },
  attemptNumber: { type: Number, default: 1 }, // New field to track T1 or T2
  openEndedResponses: { type: Object, default: {} }, // New field to store open-ended responses
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
    // Preserve personal information
    const personalInfo = {
      q0_0: userData.data.q0_0,
      q0_1: userData.data.q0_1,
      q0_2: userData.data.q0_2,
      q0_3: userData.data.q0_3,
    };

    userData.data = personalInfo;
    userData.updatedResponses = {};
    userData.updatedScores = {};
    userData.isComplete = false;
    userData.currentSection = 0; // Changed from 1 to 0 to start from the first section
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
  const { code, courses, startNewAttempt } = req.body;
  try {
    const existingCode = await Code.findOne({ code: code.toUpperCase() });
    if (!existingCode) {
      return res.status(400).json({ message: "Ungültiger Code" });
    }

    let userData = await UserData.findOne({ userId: existingCode._id });

    if (!userData) {
      // Create new user data entry
      userData = new UserData({
        userId: existingCode._id,
        data: {},
        courses: courses ? [courses] : [],
        isComplete: false,
        firstSubmissionTime: new Date(),
        latestSubmissionTime: new Date(),
        initialScores: {},
        updatedScores: {},
        initialResponses: {},
        updatedResponses: {},
        currentSection: 0,
        datenschutzConsent: false,
        unterschrift: "",
        attemptNumber: 1,
        openEndedResponses: {},
      });
      await userData.save();
    } else {
      if (startNewAttempt) {
        // User wants to start a new attempt
        // Preserve personal information
        const personalInfo = {
          q0_0: userData.data.q0_0,
          q0_1: userData.data.q0_1,
          q0_2: userData.data.q0_2,
          q0_3: userData.data.q0_3,
        };

        userData.data = personalInfo;
        userData.updatedResponses = {};
        userData.updatedScores = {};
        userData.isComplete = false;
        userData.currentSection = 0;

        if (courses && !userData.courses.includes(courses)) {
          userData.courses.push(courses);
        }

        // Increment attemptNumber
        userData.attemptNumber = (userData.attemptNumber || 1) + 1;

        await userData.save();
      } else {
        // User wants to continue initial survey or resume
        userData.latestSubmissionTime = new Date();
        await userData.save();
      }
    }

    res.status(200).json({
      message: "Login erfolgreich",
      userId: existingCode._id,
      isComplete: userData.isComplete || false,
      currentSection: userData.currentSection || 0,
      startNewAttempt: startNewAttempt || false,
      attemptNumber: userData.attemptNumber || 1,
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
    openEndedResponses,
    initialScores,
    updatedScores,
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
        currentSection: 0,
        datenschutzConsent: false,
        unterschrift: "",
        attemptNumber: 1,
        openEndedResponses: {},
      });
    }

    // Handle data updates based on section
    if (isPersonalInfo && personalInfo) {
      // For personal info section, only update specific fields
      userData.data = {
        ...userData.data,
        ...personalInfo,
      };
    } else if (data) {
      // For other sections, update all data
      userData.data = {
        ...userData.data,
        ...data,
      };
    }

    // Update metadata
    userData.currentSection =
      currentSection !== undefined ? currentSection : userData.currentSection;
    userData.latestSubmissionTime = currentTime;
    userData.isComplete = isComplete;

    // Handle scores and responses
    if (isComplete || currentSection === surveyData.length) {
      if (
        !userData.initialScores ||
        Object.keys(userData.initialScores).length === 0
      ) {
        userData.initialScores = categoryScores;
        userData.initialResponses = data;
      } else {
        userData.updatedScores = categoryScores;
        userData.updatedResponses = data;
      }
    }

    // Handle explicit score updates
    if (initialScores) {
      userData.initialScores = initialScores;
    }
    if (updatedScores) {
      userData.updatedScores = updatedScores;
    }

    // Update consent and signature
    if (datenschutzConsent !== undefined) {
      userData.datenschutzConsent = datenschutzConsent;
    }
    if (unterschrift) {
      userData.unterschrift = unterschrift;
    }

    // Update open-ended responses
    if (openEndedResponses) {
      userData.openEndedResponses = {
        ...userData.openEndedResponses,
        ...openEndedResponses,
      };
    }

    await userData.save();

    res.status(200).json({
      message: "User data saved successfully.",
      success: true,
      initialScores: userData.initialScores,
      updatedScores: userData.updatedScores,
      isComplete: userData.isComplete,
      openEndedResponses: userData.openEndedResponses,
    });
  } catch (err) {
    console.error("Error saving user data:", err);
    res.status(500).json({
      message: "Error saving user data",
      details: err.message,
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
        currentSection: userData.currentSection || 0,
        datenschutzConsent: userData.datenschutzConsent, // Include Consent
        unterschrift: userData.unterschrift || "", // Include Signature
        attemptNumber: userData.attemptNumber || 1, // Include attemptNumber
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
        const responses = user.data || {};

        // Format question responses for both T1 and T2
        const formattedResponses = {};
        questionIds
          .filter(
            (id) =>
              id.startsWith("q") &&
              id !== "q0_0" &&
              id !== "q0_1" &&
              id !== "q0_2" &&
              id !== "q0_3"
          )
          .forEach((id) => {
            formattedResponses[`${id}_t1`] = user.initialResponses?.[id] || "";
            formattedResponses[`${id}_t2`] = user.updatedResponses?.[id] || "";
          });

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
            formattedResponses: formattedResponses, // Add formatted responses
          },
          isComplete: user.isComplete || false,
          courses: user.courses || [],
          initialScores: user.initialScores || {},
          updatedScores: user.updatedScores || {},
          initialResponses: user.initialResponses || {},
          updatedResponses: user.updatedResponses || {},
          datenschutzConsent: user.datenschutzConsent,
          unterschrift: user.unterschrift || "",
          openEndedResponses: user.openEndedResponses || {},
          strategieAuswahl: user.openEndedResponses?.t1_strategy || "",
          veraenderungKompetenz: user.openEndedResponses?.t2_reflection || "",
          attemptNumber: user.attemptNumber || 1,
          // Add question-specific response fields
          questionResponses: {
            t1: user.initialResponses || {},
            t2: user.updatedResponses || {},
          },
        };
      })
    );

    // Add metadata about the response format
    const responseMetadata = {
      format: {
        t1: "Initial responses from first attempt",
        t2: "Latest responses from subsequent attempts",
      },
      questionCount: questionIds.filter(
        (id) =>
          id.startsWith("q") &&
          id !== "q0_0" &&
          id !== "q0_1" &&
          id !== "q0_2" &&
          id !== "q0_3"
      ).length,
    };

    res.json({
      users: formattedUsers,
      sections,
      metadata: responseMetadata,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      error: "Error fetching dashboard data",
      details: error.message,
    });
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
/**
 * @function calculateCategoryScores
 * @desc    Calculate category scores based on survey responses for both T1 and T2
 * @param   {Object} responses - User responses
 * @param   {Array} surveyData - Survey data structure
 * @returns {Object} - Category scores as percentages for both T1 and T2
 */
function calculateCategoryScores(responses, surveyData) {
  const categoryScores = {
    t1: {}, // Scores for initial responses
    t2: {}, // Scores for updated responses
  };

  surveyData.forEach((section, sectionIndex) => {
    // Skip personal information and conclusion sections
    if (
      section.title !== "Persönliche Angaben" &&
      section.title !== "Abschluss"
    ) {
      // Initialize score tracking for this section
      let t1TotalScore = 0;
      let t2TotalScore = 0;
      let questionCount = 0;

      // Process each question in the section
      section.questions.forEach((question, questionIndex) => {
        const questionId = `q${sectionIndex}_${questionIndex}`;

        // Only process scale-type questions
        if (question.type === "scale") {
          questionCount++;

          // Calculate T1 score
          if (responses.initialResponses?.[questionId]) {
            const t1Score = parseInt(
              responses.initialResponses[questionId],
              10
            );
            if (!isNaN(t1Score)) {
              t1TotalScore += t1Score;
            }
          }

          // Calculate T2 score if it exists
          if (responses.updatedResponses?.[questionId]) {
            const t2Score = parseInt(
              responses.updatedResponses[questionId],
              10
            );
            if (!isNaN(t2Score)) {
              t2TotalScore += t2Score;
            }
          }
        }
      });

      // Calculate percentages for this section
      if (questionCount > 0) {
        const maxPossibleScore = questionCount * 6; // 6 is the maximum score per question

        // Calculate T1 percentage
        categoryScores.t1[section.title] = Math.round(
          (t1TotalScore / maxPossibleScore) * 100
        );

        // Calculate T2 percentage if there are updated responses
        categoryScores.t2[section.title] = Math.round(
          (t2TotalScore / maxPossibleScore) * 100
        );
      } else {
        // Set default scores if no valid questions found
        categoryScores.t1[section.title] = 0;
        categoryScores.t2[section.title] = 0;
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
  categoryScores.t2.overall = calculateOverallScore(categoryScores.t2);

  // Add metadata
  categoryScores.metadata = {
    maxScorePerQuestion: 6,
    scoreType: "percentage",
    t1Label: "Initial Assessment",
    t2Label: "Follow-up Assessment",
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

  // Create headers for both T1 and T2 for each question
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
      // Create t1 and t2 columns for each question
      ...surveyData
        .flatMap((section, sectionIndex) =>
          section.questions.flatMap((q, questionIndex) => {
            // Skip personal info questions
            if (sectionIndex === 0) return [];
            const qId = `q${sectionIndex}_${questionIndex}`;
            return [
              {
                id: `${qId}_t1`,
                title: `${qId} (T1)`,
              },
              {
                id: `${qId}_t2`,
                title: `${qId} (T2)`,
              },
            ];
          })
        )
        .filter((header) => header), // Remove empty entries
      { id: "datum", title: "Datum" },
      { id: "unterschrift", title: "Unterschrift" },
      { id: "attemptNumber", title: "Attempt Number" },
    ],
  });

  const records = await Promise.all(
    allUserData.map(async (user) => {
      const codeDoc = await Code.findOne({ _id: user.userId });

      // Create base record with user info
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
        datum: user.datenschutzConsent
          ? new Date().toISOString().split("T")[0]
          : "",
        unterschrift: user.unterschrift || "",
        attemptNumber: user.attemptNumber || 1,
      };

      // Add question responses for both T1 and T2
      surveyData.forEach((section, sectionIndex) => {
        if (sectionIndex === 0) return; // Skip personal info section

        section.questions.forEach((question, questionIndex) => {
          const qId = `q${sectionIndex}_${questionIndex}`;

          // Get T1 response from initialResponses
          baseRecord[`${qId}_t1`] = user.initialResponses?.[qId] || "";

          // Get T2 response from updatedResponses if it exists
          baseRecord[`${qId}_t2`] = user.updatedResponses?.[qId] || "";
        });
      });

      return baseRecord;
    })
  );

  try {
    await csvWriter.writeRecords(records);
    console.log(`CSV file updated successfully with ${records.length} records`);

    // Log some validation info
    const questionCount = records[0]
      ? Object.keys(records[0]).filter((key) => key.includes("_t")).length / 2
      : 0;
    console.log(`Total number of questions (T1+T2 pairs): ${questionCount}`);
    console.log(`File saved to: ${process.cwd()}/survey_data.csv`);
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
