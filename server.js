const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const csvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");
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

app.get("/dashboard", authenticate, (req, res) => {
  res.sendFile(path.resolve(__dirname, "docs", "dashboard.html"));
});

app.get("/api/survey-data", authenticate, async (req, res) => {
  try {
    const surveys = await UserData.find().sort({ "data.timestamp": -1 });
    res.json(surveys);
  } catch (error) {
    res.status(500).json({ error: "Error fetching survey data" });
  }
});

app.get("/api/download-csv", authenticate, (req, res) => {
  const filePath = path.join(__dirname, "survey_data.csv");
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error("CSV file not found:", err);
      return res.status(404).send("CSV file not found");
    }
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=survey_data.csv"
    );
    fs.createReadStream(filePath).pipe(res);
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "docs", "index.html"));
});

// Helper Functions
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader === "Bearer your_secure_token") {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}

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
