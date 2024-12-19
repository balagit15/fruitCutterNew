// Game state variables
let score = 0;
let isGameOver = false;
let currentQuestionIndex = 0;
let questions = [];
let lastMouseX = 0;
let lastMouseY = 0;
let isSlicing = false;
let sliceStartX = 0;
let sliceStartY = 0;

// DOM Elements
const blade = document.querySelector('.blade');
let sliceTrail = null;

// Mouse movement handling
const coords = { x: 0, y: 0 };
const circles = document.querySelectorAll(".circle");

const colors = [
  "#ffb56b", "#fdaf69", "#f89d63", "#f59761", "#ef865e", "#ec805d",
  "#e36e5c", "#df685c", "#d5585c", "#d1525c", "#c5415d", "#c03b5d",
  "#b22c5e", "#ac265e", "#9c155f", "#950f5f", "#830060", "#7c0060",
  "#680060", "#60005f", "#48005f", "#3d005e"
];

circles.forEach((circle, index) => {
  circle.x = 0;
  circle.y = 0;
  circle.style.backgroundColor = colors[index % colors.length];
});

window.addEventListener("mousemove", (e) => {
  coords.x = e.clientX;
  coords.y = e.clientY;
});

function animateCircles() {
  let x = coords.x;
  let y = coords.y;

  circles.forEach((circle, index) => {
    circle.style.left = x - 12 + "px";
    circle.style.top = y - 12 + "px";
    circle.style.transform = `scale(${(circles.length - index) / circles.length})`;

    const nextCircle = circles[index + 1] || circles[0];
    x += (nextCircle.x - x) * 0.3;
    y += (nextCircle.y - y) * 0.3;

    circle.x = x;
    circle.y = y;
  });

  requestAnimationFrame(animateCircles);
}

animateCircles();

const gameOverModal = document.getElementById('game-over-modal');
gameOverModal.style.display = 'none';

document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem('username');
  const college = localStorage.getItem('college');
  const userDetails = document.getElementById('user-details');
  
  if (username && college) {
    userDetails.textContent = `Player: ${username} | College: ${college}`;
  } else {
    userDetails.textContent = 'Welcome to the game!';
  }
});


document.addEventListener('mousedown', (e) => {
  isSlicing = true;
  sliceStartX = e.clientX;
  sliceStartY = e.clientY;
  
  sliceTrail = document.createElement('div');
  sliceTrail.className = 'slice-trail';
  document.body.appendChild(sliceTrail);
});

document.addEventListener('mouseup', () => {
  isSlicing = false;
  if (sliceTrail) {
    sliceTrail.remove();
    sliceTrail = null;
  }
});

function updateSliceTrail(currentX, currentY) {
  if (!sliceTrail) return;

  const length = Math.hypot(currentX - sliceStartX, currentY - sliceStartY);
  const angle = Math.atan2(currentY - sliceStartY, currentX - sliceStartX);

  sliceTrail.style.width = length + 'px';
  sliceTrail.style.left = sliceStartX + 'px';
  sliceTrail.style.top = sliceStartY + 'px';
  sliceTrail.style.transform = `rotate(${angle}rad)`;
}

// Create fruit elements
function createFruit(option, index) {
  const fruit = document.createElement('div');
  fruit.className = 'fruit-container';
  fruit.style.left = `${(index + 1) * (window.innerWidth / 4)}px`;
  fruit.style.top = `${window.innerHeight + 100}px`;

  const wrapper = document.createElement('div');
  wrapper.className = 'fruit-wrapper';

  // Create left and right halves
  const leftHalf = document.createElement('div');
  leftHalf.className = 'fruit-half left';
  leftHalf.style.backgroundImage = `url(${getFruitImage(index)})`;
  leftHalf.style.backgroundSize = 'cover';

  const rightHalf = document.createElement('div');
  rightHalf.className = 'fruit-half right';
  rightHalf.style.backgroundImage = `url(${getFruitImage(index)})`;
  rightHalf.style.backgroundSize = 'cover';

  const text = document.createElement('div');
  text.className = 'fruit-text';
  text.textContent = option;

  wrapper.appendChild(leftHalf);
  wrapper.appendChild(rightHalf);
  fruit.appendChild(wrapper);
  fruit.appendChild(text);

  document.body.appendChild(fruit);
  
  // Animate fruit rising
  setTimeout(() => {
    fruit.style.transition = 'top 1s ease-out';
    fruit.style.top = `${window.innerHeight / 2}px`;
  }, 100);

  return fruit;
}

function getFruitImage(index) {
  const fruits = [
    'images/apple2.png',
    'images/orange1.png',
    'images/watermelon1.png'
  ];
  return fruits[index % fruits.length];
}

// Slice effect and juice particles
function createJuiceParticles(x, y, color) {
  for (let i = 0; i < 10; i++) {
    const particle = document.createElement('div');
    particle.className = 'juice-particle';
    particle.style.backgroundColor = color;
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';

    const angle = (Math.random() * Math.PI * 2);
    const velocity = 5 + Math.random() * 5;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;

    document.body.appendChild(particle);

    let posX = x;
    let posY = y;
    let time = 0;

    function animate() {
      time += 0.1;
      posX += vx;
      posY += vy + time * 2; // Add gravity effect

      particle.style.left = posX + 'px';
      particle.style.top = posY + 'px';
      particle.style.opacity = 1 - time / 2;

      if (time < 2) {
        requestAnimationFrame(animate);
      } else {
        particle.remove();
      }
    }

    animate();
  }
}

async function fetchLeaderboard() {
  try {
    const response = await fetch('http://localhost:5000/leaderboard');
    const leaderboardData = await response.json();

    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';

    leaderboardData.forEach((entry, index) => {
      const listItem = document.createElement('li');
      listItem.innerHTML = `<span>${index + 1}. ${entry.username} (${entry.college})</span> <span>${entry.score}</span>`;
      leaderboardList.appendChild(listItem);
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
  }
}

// Initialize game
fetchQuestions();
fetchLeaderboard();

// Update question and create new fruits
function updateQuestion() {
  if (!questions || currentQuestionIndex >= questions.length) {
    gameOver();
    return;
  }

  const question = questions[currentQuestionIndex];
  document.getElementById('question').textContent = question.question;

  // Remove existing fruits
  document.querySelectorAll('.fruit-container').forEach(fruit => fruit.remove());

  // Create new fruits with options
  question.options.forEach((option, index) => {
    const fruit = createFruit(option, index);
    
    // Add slice detection
    fruit.addEventListener('mousemove', (e) => {
      if (isSlicing) {
        const rect = fruit.getBoundingClientRect();
        const fruitCenterX = rect.left + rect.width / 2;
        const fruitCenterY = rect.top + rect.height / 2;

        fruit.classList.add('sliced');
        createJuiceParticles(fruitCenterX, fruitCenterY, '#ff6b6b');

        // Check if correct answer
        if (index === question.correctOption) {
          score += 10;
          document.getElementById('score').textContent = `Score: ${score}`;
        }

        setTimeout(() => {
          fruit.remove();
          currentQuestionIndex++;
          updateQuestion();
        }, 1000);
      }
    });
  });
}

// Game over handling
// Game over handling
function gameOver() {
  isGameOver = true;

  // Update the question display to show "Game Over" message
  const questionElement = document.getElementById('question');
  if (questionElement) {
    questionElement.textContent = "Game Over! Final Score: " + score;
  }

  // Fade out all fruit containers
  const fruitContainers = document.querySelectorAll('.fruit-container');
  fruitContainers.forEach(container => {
    container.style.opacity = '0';
    container.style.transition = 'opacity 1s ease';
  });

  // Show the game over modal
  const gameOverModal = document.getElementById('game-over-modal');
  const finalScore = document.getElementById('final-score');
  const correctAnswersList = document.getElementById('correct-answers-list');

  if (gameOverModal && finalScore && correctAnswersList) {
    finalScore.textContent = "Your Score: " + score;

    // Display correct answers
    correctAnswersList.innerHTML = '';
    questions.forEach((question, index) => {
      const listItem = document.createElement('li');
      listItem.textContent = `Q${index + 1}: ${question.options[question.correctOption]} (Correct Answer)`;
      correctAnswersList.appendChild(listItem);
    });

    gameOverModal.style.display = 'flex';
  }

  // Save the score to the backend
  const username = localStorage.getItem('username');
  const college = localStorage.getItem('college');

  fetch('http://localhost:5000/saveScore', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, college, score }),
  })
    .then(response => response.json())
    .then(data => {
      console.log('Score saved successfully:', data);
    })
    .catch(error => {
      console.error('Error saving score:', error);
    });
}


// Game control functions
function resetGame() {
  score = 0;
  currentQuestionIndex = 0;
  isGameOver = false;
  document.getElementById('game-over-modal').style.display = 'none';
  document.getElementById('score').textContent = 'Score: 0';
  fetchQuestions();
}

function exitGame() {
  localStorage.removeItem('username');
  localStorage.removeItem('college');
  window.location.href = 'index.html';
}

// Fetch questions and start game
async function fetchQuestions() {
  try {
    const response = await fetch('http://localhost:5000/getQuestions');
    questions = await response.json();
    updateQuestion();
  } catch (error) {
    console.error('Error fetching questions:', error);
    alert('Failed to load questions. Please try again later.');
  }
}

// Initialize game
fetchQuestions();