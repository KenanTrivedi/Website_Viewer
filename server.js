const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const app = express()
app.use(bodyParser.json())

// Connect to MongoDB (you can use MongoDB Atlas for a free tier)
mongoose.connect('your_mongodb_connection_string', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

// Define a simple User model
const User = mongoose.model(
  'User',
  new mongoose.Schema({
    username: String,
    password: String, // Hash passwords in a real app
    surveyResponses: [String],
  })
)

// Example route
app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
