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
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Schema for Questions
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctOption: { type: Number, required: true }
});

// Create Model for Questions
const Question = mongoose.model('Question', questionSchema);

// API to add a new question
app.post('/add-question', async (req, res) => {
  const { question, options, correctOption } = req.body;

  // Validate input
  if (!question || !options || correctOption == null) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const newQuestion = new Question({ question, options, correctOption });
    await newQuestion.save();
    res.status(201).json({ message: 'Question added successfully!' });
  } catch (err) {
    res.status(400).json({ message: 'Error adding question', error: err.message });
  }
});

// API to get all questions
app.get('/get-questions', async (req, res) => {
  try {
    const questions = await Question.find();
    res.status(200).json(questions);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving questions', error: err.message });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
