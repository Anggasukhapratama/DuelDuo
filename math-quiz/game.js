import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

let gameState = {
  isPlaying: false,
  timeLeft: 120,
  scores: { p1: 0, p2: 0 },
  currentQuestion: { p1: null, p2: null },
  canAnswer: { p1: true, p2: true }
};

const GAME_DURATION = 120;
const QUESTION_DELAY = 2000;

let hoverState = {
  p1: { lastDetectedButton: null, hoverStartTime: null },
  p2: { lastDetectedButton: null, hoverStartTime: null }
};
const HOVER_DURATION = 800;

// Generate random math question
function generateQuestion() {
  const operations = ['+', '-', '*'];
  const operation = operations[Math.floor(Math.random() * operations.length)];
  
  let num1, num2, correctAnswer;
  
  switch(operation) {
    case '+':
      num1 = Math.floor(Math.random() * 50) + 1;
      num2 = Math.floor(Math.random() * 50) + 1;
      correctAnswer = num1 + num2;
      break;
    case '-':
      num1 = Math.floor(Math.random() * 50) + 20;
      num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
      correctAnswer = num1 - num2;
      break;
    case '*':
      num1 = Math.floor(Math.random() * 12) + 1;
      num2 = Math.floor(Math.random() * 12) + 1;
      correctAnswer = num1 * num2;
      break;
  }
  
  // Generate 3 options (1 correct, 2 wrong)
  const wrongAnswer1 = correctAnswer + Math.floor(Math.random() * 10) + 1;
  const wrongAnswer2 = Math.max(0, correctAnswer - Math.floor(Math.random() * 10) - 1);
  
  const options = [correctAnswer, wrongAnswer1, wrongAnswer2];
  // Shuffle options
  options.sort(() => Math.random() - 0.5);
  
  return {
    text: `${num1} ${operation} ${num2} = ?`,
    correctAnswer,
    options
  };
}

function displayQuestion(playerId) {
  const question = generateQuestion();
  gameState.currentQuestion[playerId] = question;
  
  document.getElementById(`question-${playerId}`).textContent = question.text;
  
  const answersContainer = document.getElementById(`answers-${playerId}`);
  answersContainer.innerHTML = '';
  
  question.options.forEach((option, index) => {
    const button = document.createElement('div');
    button.className = 'answer-btn';
    button.textContent = option;
    button.dataset.answer = option;
    button.dataset.index = index;
    button.id = `answer-${playerId}-${index}`;
    answersContainer.appendChild(button);
  });
}

function checkAnswer(playerId, selectedAnswer) {
  if (!gameState.canAnswer[playerId]) return;
  
  const question = gameState.currentQuestion[playerId];
  const isCorrect = selectedAnswer === question.correctAnswer;
  
  // Find and highlight the selected button
  const answersContainer = document.getElementById(`answers-${playerId}`);
  const buttons = answersContainer.querySelectorAll('.answer-btn');
  
  buttons.forEach(button => {
    const answer = parseInt(button.dataset.answer);
    if (answer === selectedAnswer) {
      button.className = isCorrect ? 'answer-btn correct' : 'answer-btn wrong';
    }
    if (answer === question.correctAnswer && !isCorrect) {
      button.className = 'answer-btn correct';
    }
  });
  
  if (isCorrect) {
    gameState.scores[playerId]++;
    updateScore(playerId);
  }
  
  gameState.canAnswer[playerId] = false;
  
  // Show next question after delay
  setTimeout(() => {
    if (gameState.isPlaying) {
      displayQuestion(playerId);
      gameState.canAnswer[playerId] = true;
    }
  }, QUESTION_DELAY);
}

function updateScore(playerId) {
  document.getElementById(`score-${playerId}`).textContent = gameState.scores[playerId];
}

// Setup MediaPipe Hands
function setupHandTracking(videoElement, canvasElement) {
  const hands = new Hands({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
  });

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  hands.onResults((results) => {
    const ctx = canvasElement.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Draw vertical divider line
    ctx.strokeStyle = '#CAE8BD';
    ctx.lineWidth = 6;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.moveTo(canvasElement.width / 2, 0);
    ctx.lineTo(canvasElement.width / 2, canvasElement.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw text labels
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'rgba(202, 232, 189, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText('PLAYER 1', canvasElement.width * 0.25, 40);
    ctx.fillText('PLAYER 2', canvasElement.width * 0.75, 40);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      results.multiHandLandmarks.forEach((landmarks) => {
        const indexTip = landmarks[8];
        const playerId = indexTip.x < 0.5 ? 'p1' : 'p2';
        
        drawHandPointer(ctx, landmarks);
        
        if (gameState.isPlaying && gameState.canAnswer[playerId]) {
          detectButtonHover(landmarks, playerId, canvasElement, ctx);
        }
      });
    } else {
      hoverState.p1 = { lastDetectedButton: null, hoverStartTime: null };
      hoverState.p2 = { lastDetectedButton: null, hoverStartTime: null };
    }
    
    ctx.restore();
  });

  function detectButtonHover(landmarks, playerId, canvas, ctx) {
    const indexTip = landmarks[8];
    const x = indexTip.x;
    const y = indexTip.y;
    
    let buttonIndex = null;
    if (y < 0.33) buttonIndex = 0;
    else if (y < 0.66) buttonIndex = 1;
    else buttonIndex = 2;
    
    const buttonElement = document.getElementById(`answer-${playerId}-${buttonIndex}`);
    
    if (buttonElement && buttonIndex !== null) {
      const allButtons = document.querySelectorAll(`#answers-${playerId} .answer-btn`);
      allButtons.forEach((btn, idx) => {
        if (idx === buttonIndex && !btn.classList.contains('correct') && !btn.classList.contains('wrong')) {
          btn.style.background = '#CAE8BD';
          btn.style.transform = 'scale(1.05)';
        } else if (!btn.classList.contains('correct') && !btn.classList.contains('wrong')) {
          btn.style.background = '#ECFAE5';
          btn.style.transform = 'scale(1)';
        }
      });
      
      if (hoverState[playerId].lastDetectedButton === buttonIndex) {
        const hoverDuration = Date.now() - hoverState[playerId].hoverStartTime;
        
        drawHoverProgress(ctx, x, y, hoverDuration / HOVER_DURATION);
        
        if (hoverDuration >= HOVER_DURATION) {
          const answer = parseInt(buttonElement.dataset.answer);
          checkAnswer(playerId, answer);
          hoverState[playerId] = { lastDetectedButton: null, hoverStartTime: null };
        }
      } else {
        hoverState[playerId].lastDetectedButton = buttonIndex;
        hoverState[playerId].hoverStartTime = Date.now();
      }
    } else {
      hoverState[playerId] = { lastDetectedButton: null, hoverStartTime: null };
    }
  }

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    width: 1280,
    height: 480
  });

  camera.start();
}

function drawHandPointer(ctx, landmarks) {
  const indexTip = landmarks[8];
  const x = indexTip.x * ctx.canvas.width;
  const y = indexTip.y * ctx.canvas.height;
  
  // Draw pointer
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, 2 * Math.PI);
  ctx.fillStyle = '#FF5722';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.stroke();
  
  // Draw inner dot
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();
}

function drawHoverProgress(ctx, x, y, progress) {
  const centerX = x * ctx.canvas.width;
  const centerY = y * ctx.canvas.height;
  const radius = 30;
  
  // Draw progress arc
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, -Math.PI / 2, (-Math.PI / 2) + (progress * 2 * Math.PI));
  ctx.strokeStyle = '#4CAF50';
  ctx.lineWidth = 6;
  ctx.stroke();
}

function startGame() {
  gameState.isPlaying = true;
  gameState.timeLeft = GAME_DURATION;
  gameState.scores = { p1: 0, p2: 0 };
  gameState.canAnswer = { p1: true, p2: true };
  
  updateScore('p1');
  updateScore('p2');
  
  // Display first questions
  displayQuestion('p1');
  displayQuestion('p2');
  
  document.getElementById('start-btn').disabled = true;
  document.getElementById('stop-btn').disabled = false;
  document.getElementById('status').textContent = 'Game dimulai! Tunjuk jawaban dengan tangan!';
  
  // Timer countdown
  const timerInterval = setInterval(() => {
    if (!gameState.isPlaying) {
      clearInterval(timerInterval);
      return;
    }
    
    gameState.timeLeft--;
    const minutes = Math.floor(gameState.timeLeft / 60);
    const seconds = gameState.timeLeft % 60;
    document.getElementById('timer').textContent = `Waktu: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (gameState.timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  gameState.isPlaying = false;
  
  const winner = gameState.scores.p1 > gameState.scores.p2 ? 'Pemain 1' :
                 gameState.scores.p2 > gameState.scores.p1 ? 'Pemain 2' : 'SERI';
  
  document.getElementById('status').textContent = 
    winner === 'SERI' ? 
    `Game Selesai! SERI! (${gameState.scores.p1} - ${gameState.scores.p2})` :
    `Game Selesai! ${winner} MENANG! (${gameState.scores.p1} - ${gameState.scores.p2})`;
  
  document.getElementById('timer').textContent = '';
  document.getElementById('start-btn').disabled = false;
  document.getElementById('stop-btn').disabled = true;
  
  document.getElementById('question-p1').textContent = 'Game selesai!';
  document.getElementById('question-p2').textContent = 'Game selesai!';
  document.getElementById('answers-p1').innerHTML = '';
  document.getElementById('answers-p2').innerHTML = '';
}

function stopGame() {
  endGame();
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  const videoShared = document.getElementById('video-shared');
  const canvasShared = document.getElementById('canvas-shared');
  
  canvasShared.width = 1280;
  canvasShared.height = 480;
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 1280, height: 480 } 
    });
    
    videoShared.srcObject = stream;
    videoShared.style.transform = 'scaleX(-1)';
    
    setupHandTracking(videoShared, canvasShared);
    
    document.getElementById('status').textContent = 'Kamera aktif! Player 1 di kiri, Player 2 di kanan';
  } catch (err) {
    console.error('Error accessing camera:', err);
    document.getElementById('status').textContent = 'Error: Tidak bisa mengakses kamera';
  }
  
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('stop-btn').addEventListener('click', stopGame);
});
