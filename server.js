const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcrypt");
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
const dashboardUserSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const DashboardUser = mongoose.model("DashboardUser", dashboardUserSchema);

// Create initial dashboard user
async function createInitialDashboardUser() {
  try {
    const existingUser = await DashboardUser.findOne({ username: "admin" });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash("your_secure_password", 10);
      const newUser = new DashboardUser({
        username: "admin",
        password: hashedPassword,
      });
      await newUser.save();
      console.log("Initial dashboard user created");
    }
  } catch (error) {
    console.error("Error creating initial dashboard user:", error);
  }
}

createInitialDashboardUser();

// Routes
app.post("/api/dashboard-login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await DashboardUser.findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { userId: user._id, isDashboardUser: true },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      res.json({ token }); // Send this token to the client
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ error: "Login error" });
  }
});

app.delete(
  "/api/delete-dashboard-user",
  authenticateDashboardUser,
  async (req, res) => {
    const { username } = req.body;
    try {
      const result = await DashboardUser.findOneAndDelete({ username });
      if (!result) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Error deleting user" });
    }
  }
);

// Authentication Middleware
function authenticateDashboardUser(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (decoded.isDashboardUser) {
        next();
      } else {
        res.status(403).json({ error: "Access denied" });
      }
    });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
