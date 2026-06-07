import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

let gameState = {
  isPlaying: false,
  timeLeft: 60,
  scores: { p1: 0, p2: 0 },
  targets: { p1: [], p2: [] },
  handsDetected: { p1: false, p2: false }
};

const TARGET_SPAWN_INTERVAL = 1500;
const TARGET_LIFETIME = 3000;
const GAME_DURATION = 60;

let handsTrackers = { p1: null, p2: null };
let readyCheckInterval = null;

// Setup MediaPipe Hands untuk detect 2 tangan
function setupHandTracking(videoElement, canvasElement) {
  const hands = new Hands({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
  });

  hands.setOptions({
    maxNumHands: 2, // Detect 2 tangan sekaligus
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  hands.onResults((results) => {
    const ctx = canvasElement.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Draw vertical divider line in the middle - NEON STYLE
    const gradient = ctx.createLinearGradient(canvasElement.width / 2 - 3, 0, canvasElement.width / 2 + 3, 0);
    gradient.addColorStop(0, 'rgba(0, 245, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 245, 255, 1)');
    gradient.addColorStop(1, 'rgba(0, 245, 255, 0)');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00F5FF';
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.moveTo(canvasElement.width / 2, 0);
    ctx.lineTo(canvasElement.width / 2, canvasElement.height);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    
    // Draw text labels - NEON GLOW
    ctx.font = 'bold 28px Orbitron, Arial';
    ctx.textAlign = 'center';
    
    // Player 1 label
    ctx.fillStyle = '#FF006E';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#FF006E';
    ctx.fillText('PLAYER 1', canvasElement.width * 0.25, 45);
    
    // Player 2 label
    ctx.fillStyle = '#00F5FF';
    ctx.shadowColor = '#00F5FF';
    ctx.fillText('PLAYER 2', canvasElement.width * 0.75, 45);
    ctx.shadowBlur = 0;
    
    // Draw targets for both players
    drawTargets(ctx, 'p1');
    drawTargets(ctx, 'p2');
    
    // Reset hand detection
    gameState.handsDetected.p1 = false;
    gameState.handsDetected.p2 = false;
    
    // Process detected hands
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      results.multiHandLandmarks.forEach((landmarks) => {
        // Determine which side of screen (left = p1, right = p2)
        const indexTip = landmarks[8];
        const playerId = indexTip.x < 0.5 ? 'p1' : 'p2';
        
        gameState.handsDetected[playerId] = true;
        
        drawHand(ctx, landmarks, playerId);
        
        if (gameState.isPlaying) {
          checkPunchCollision(landmarks, playerId);
        }
      });
    }
    
    ctx.restore();
  });

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    width: 1280,
    height: 480
  });

  camera.start();
}

function drawHand(ctx, landmarks, playerId) {
  const indexTip = landmarks[8];
  const x = indexTip.x * ctx.canvas.width;
  const y = indexTip.y * ctx.canvas.height;
  
  const color = playerId === 'p1' ? '#FF006E' : '#00F5FF';
  
  // Outer glow
  ctx.beginPath();
  ctx.arc(x, y, 25, 0, 2 * Math.PI);
  ctx.fillStyle = `${color}33`;
  ctx.fill();
  
  // Main circle
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.shadowBlur = 20;
  ctx.shadowColor = color;
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // Inner dot
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();
}

function spawnTarget(playerId) {
  // Spawn targets in respective halves
  const isP1 = playerId === 'p1';
  const xMin = isP1 ? 0.05 : 0.55;
  const xMax = isP1 ? 0.45 : 0.95;
  
  const target = {
    x: Math.random() * (xMax - xMin) + xMin,
    y: Math.random() * 0.7 + 0.15,
    radius: 50,
    id: Date.now() + Math.random(),
    spawnTime: Date.now()
  };
  
  gameState.targets[playerId].push(target);
  
  setTimeout(() => {
    gameState.targets[playerId] = gameState.targets[playerId].filter(t => t.id !== target.id);
  }, TARGET_LIFETIME);
}

function drawTargets(ctx, playerId) {
  const targets = gameState.targets[playerId];
  const color = playerId === 'p1' ? '#FF006E' : '#8B00FF';
  
  targets.forEach(target => {
    const x = target.x * ctx.canvas.width;
    const y = target.y * ctx.canvas.height;
    const age = Date.now() - target.spawnTime;
    const opacity = Math.max(0, 1 - (age / TARGET_LIFETIME));
    
    const pulse = Math.sin(Date.now() / 200) * 5;
    const radius = target.radius + pulse;
    
    // Outer glow
    ctx.beginPath();
    ctx.arc(x, y, radius + 10, 0, 2 * Math.PI);
    ctx.fillStyle = `${color}22`;
    ctx.fill();
    
    // Outer circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = `${color}${Math.floor(opacity * 50).toString(16).padStart(2, '0')}`;
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    ctx.fill();
    
    // Middle circle
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.7, 0, 2 * Math.PI);
    ctx.fillStyle = `${color}${Math.floor(opacity * 100).toString(16).padStart(2, '0')}`;
    ctx.fill();
    
    // Center circle
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.4, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Orbitron, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#000';
    ctx.fillText('PUNCH!', x, y);
    ctx.shadowBlur = 0;
  });
}

function checkPunchCollision(landmarks, playerId) {
  const indexTip = landmarks[8];
  const canvasElement = document.getElementById('canvas-shared');
  const x = indexTip.x * canvasElement.width;
  const y = indexTip.y * canvasElement.height;
  
  gameState.targets[playerId].forEach((target, index) => {
    const tx = target.x * canvasElement.width;
    const ty = target.y * canvasElement.height;
    const distance = Math.sqrt((x - tx) ** 2 + (y - ty) ** 2);
    
    if (distance < target.radius) {
      gameState.scores[playerId]++;
      updateScore(playerId);
      gameState.targets[playerId].splice(index, 1);
      showHitEffect(canvasElement, tx, ty);
    }
  });
}

function showHitEffect(canvas, x, y) {
  const ctx = canvas.getContext('2d');
  let radius = 10;
  
  const animate = () => {
    if (radius > 80) return;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(57, 255, 20, ${1 - radius / 80})`;
    ctx.lineWidth = 5;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#39FF14';
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    radius += 5;
    requestAnimationFrame(animate);
  };
  
  animate();
}

function updateScore(playerId) {
  document.getElementById(`score-${playerId}`).textContent = gameState.scores[playerId];
}

function startGame() {
  // Check if both hands are detected
  if (!gameState.handsDetected.p1 || !gameState.handsDetected.p2) {
    document.getElementById('status').textContent = '⚠️ Kedua pemain harus terdeteksi dulu! Posisikan tangan di area masing-masing';
    return;
  }
  
  gameState.isPlaying = true;
  gameState.timeLeft = GAME_DURATION;
  gameState.scores = { p1: 0, p2: 0 };
  gameState.targets = { p1: [], p2: [] };
  
  updateScore('p1');
  updateScore('p2');
  
  document.getElementById('start-btn').disabled = true;
  document.getElementById('stop-btn').disabled = false;
  document.getElementById('status').textContent = '🔥 Game dimulai! Player 1 di kiri, Player 2 di kanan!';
  
  const spawnInterval = setInterval(() => {
    if (!gameState.isPlaying) {
      clearInterval(spawnInterval);
      return;
    }
    spawnTarget('p1');
    spawnTarget('p2');
  }, TARGET_SPAWN_INTERVAL);
  
  const timerInterval = setInterval(() => {
    if (!gameState.isPlaying) {
      clearInterval(timerInterval);
      return;
    }
    
    gameState.timeLeft--;
    document.getElementById('timer').textContent = `⏱️ Waktu: ${gameState.timeLeft}s`;
    
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
    `🎮 Game Selesai! SERI! (${gameState.scores.p1} - ${gameState.scores.p2})` :
    `🏆 Game Selesai! ${winner} MENANG! (${gameState.scores.p1} - ${gameState.scores.p2})`;
  
  document.getElementById('timer').textContent = '';
  document.getElementById('start-btn').disabled = false;
  document.getElementById('stop-btn').disabled = true;
  
  gameState.targets = { p1: [], p2: [] };
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
    // Mobile-friendly camera constraints
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 480 },
        facingMode: 'user', // Front camera
        aspectRatio: { ideal: 16/9 }
      }
    };
    
    // Request camera permission explicitly
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    videoShared.srcObject = stream;
    videoShared.style.transform = 'scaleX(-1)';
    
    // Wait for video to be ready
    await new Promise((resolve) => {
      videoShared.onloadedmetadata = () => {
        videoShared.play();
        resolve();
      };
    });
    
    setupHandTracking(videoShared, canvasShared);
    
    document.getElementById('status').textContent = '📹 Kamera aktif! Tunjukkan tangan untuk siap bermain';
    
    // Check hand detection status
    setInterval(() => {
      const p1Status = gameState.handsDetected.p1 ? '✅' : '❌';
      const p2Status = gameState.handsDetected.p2 ? '✅' : '❌';
      
      if (!gameState.isPlaying) {
        document.getElementById('status').textContent = 
          `Player 1: ${p1Status} | Player 2: ${p2Status} | ${gameState.handsDetected.p1 && gameState.handsDetected.p2 ? '✅ Siap bermain!' : '⚠️ Tunjukkan tangan di area masing-masing'}`;
      }
    }, 500);
  } catch (err) {
    console.error('Error accessing camera:', err);
    let errorMsg = 'Error: Tidak bisa mengakses kamera. ';
    
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      errorMsg += 'Izinkan akses kamera di pengaturan browser!';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      errorMsg += 'Kamera tidak ditemukan!';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      errorMsg += 'Kamera sedang digunakan aplikasi lain!';
    } else if (err.name === 'OverconstrainedError') {
      errorMsg += 'Kamera tidak support resolusi yang diminta!';
    } else {
      errorMsg += err.message;
    }
    
    document.getElementById('status').textContent = errorMsg;
    document.getElementById('start-btn').disabled = true;
  }
  
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('stop-btn').addEventListener('click', stopGame);
});
