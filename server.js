const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
require("dotenv").config();

app.use(bodyParser.json());
app.use(express.static("docs"));

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.log("MongoDB connection error:", err);
  });

const codeSchema = new mongoose.Schema({ code: String });
const Code = mongoose.model("Code", codeSchema);

app.post("/register", async (req, res) => {
  const { code } = req.body;
  const newCode = new Code({ code });
  await newCode.save();
  console.log("Code saved:", code);
  res.send("Code saved");
});

app.post("/login", async (req, res) => {
  const { code } = req.body;
  console.log("Login attempt with code:", code); // Log the incoming code
  const validCode = await Code.findOne({ code });
  if (validCode) {
    console.log("Code found:", validCode); // Log if the code is found
    res.redirect("/survey.html");
  } else {
    console.log("Invalid code"); // Log if the code is not found
    res.status(401).send("Invalid code");
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "docs", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
