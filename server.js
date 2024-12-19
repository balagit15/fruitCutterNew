const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/fruit_game_scoreCard', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Define Schema for User Data
const userSchema = new mongoose.Schema({
  username: String,
  college: String,
  score: Number
});

// Create Model for User Data
const User = mongoose.model('User', userSchema);

// Define Schema for Questions
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctOption: { type: Number, required: true }
});

// Create Model for Questions
const Question = mongoose.model('Question', questionSchema);

// API to fetch questions from MongoDB
app.get('/getQuestions', async (req, res) => {
  try {
    const questions = await Question.find(); // Retrieve all questions
    res.status(200).json(questions); // Send questions as JSON
  } catch (err) {
    res.status(500).send('Error fetching questions: ' + err);
  }
});

// API to save user data to MongoDB
app.post('/saveScore', (req, res) => {
  const { username, college, score } = req.body;

  const newUser = new User({
    username,
    college,
    score
  });

  newUser.save()
    .then(() => res.status(201).send('User score saved successfully'))
    .catch(err => res.status(400).send('Error saving score: ' + err));
});


app.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await User.find().sort({ score: -1 }).limit(6);
    res.status(200).json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
