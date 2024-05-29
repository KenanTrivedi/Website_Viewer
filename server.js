const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
require('dotenv').config()

const app = express()
app.use(bodyParser.json())

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Could not connect to MongoDB...', err))

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  surveyResponses: [String],
})

const User = mongoose.model('User', UserSchema)

app.post('/register', async (req, res) => {
  const { username, password } = req.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const newUser = new User({ username, password: hashedPassword })
  await newUser.save()
  res.status(201).send('User registered successfully')
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body
  const user = await User.findOne({ username })
  if (!user) return res.status(400).send('Invalid username or password')
  const validPassword = await bcrypt.compare(password, user.password)
  if (!validPassword)
    return res.status(400).send('Invalid username or password')
  res.send('Login successful')
})

app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
