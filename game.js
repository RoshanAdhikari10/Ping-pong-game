// ---- DOM Elements ----
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const playerScoreEl = document.getElementById('playerScore');
const aiScoreEl = document.getElementById('aiScore');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const musicBtn = document.getElementById('musicBtn');
const messageEl = document.getElementById('message');
const hitSound = document.getElementById('hitSound');
const scoreSound = document.getElementById('scoreSound');
const music = document.getElementById('music');

// ---- Game Constants ----
const PADDLE = {
    WIDTH: 14,
    HEIGHT: 120,
    MARGIN: 34,
    SPEED: 9,
    EASING: 0.19
};
const BALL = {
    SIZE: 18,
    SPEED: 7.5,
    MAX_ANGLE: Math.PI / 4,
    ACCEL: 0.08
};
const PLAYER_X = PADDLE.MARGIN;
const AI_X = canvas.width - PADDLE.WIDTH - PADDLE.MARGIN;
const WIN_SCORE = 7;

// ---- Game State ----
let playerY, playerTargetY, aiY, ballX, ballY, ballVelX, ballVelY;
let playerScore = 0, aiScore = 0;
let running = false, gameOver = false, paused = false;
let isMusicMuted = false;

// ---- Mobile Touch State ----
let touchActive = false;

// ---- Utility Functions ----
function resetBall(direction=1) {
    ballX = canvas.width / 2 - BALL.SIZE / 2;
    ballY = canvas.height / 2 - BALL.SIZE / 2;
    let angle = (Math.random() * BALL.MAX_ANGLE * 2) - BALL.MAX_ANGLE;
    ballVelX = BALL.SPEED * Math.cos(angle) * direction;
    ballVelY = BALL.SPEED * Math.sin(angle);
    aiY = (canvas.height - PADDLE.HEIGHT) / 2;
    playerTargetY = (canvas.height - PADDLE.HEIGHT) / 2;
}

function resetGame() {
    playerScore = 0;
    aiScore = 0;
    playerY = (canvas.height - PADDLE.HEIGHT) / 2;
    playerTargetY = playerY;
    aiY = (canvas.height - PADDLE.HEIGHT) / 2;
    resetBall(Math.random() > 0.5 ? 1 : -1);
    updateScores();
    running = false;
    gameOver = false;
    paused = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = "Pause";
    musicBtn.disabled = true;
    musicBtn.textContent = isMusicMuted ? "Unmute Music" : "Mute Music";
    messageEl.textContent = "Move your mouse or drag left side on mobile to control the left paddle!";
    stopMusic();
}

// ---- Game Drawing ----
function drawCourt() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.strokeStyle = '#52e3c2';
    ctx.setLineDash([14, 28]);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.restore();
}

function drawPaddles() {
    ctx.fillStyle = '#e8eaed';
    ctx.fillRect(PLAYER_X, playerY, PADDLE.WIDTH, PADDLE.HEIGHT);
    ctx.fillRect(AI_X, aiY, PADDLE.WIDTH, PADDLE.HEIGHT);
}

function drawBall() {
    ctx.save();
    ctx.fillStyle = '#52e3c2';
    ctx.shadowColor = "#52e3c2";
    ctx.shadowBlur = 20;
    ctx.fillRect(ballX, ballY, BALL.SIZE, BALL.SIZE);
    ctx.restore();
}

function drawGameOver(winner) {
    ctx.save();
    ctx.globalAlpha = 0.93;
    ctx.fillStyle = '#191c20';
    ctx.fillRect(0, canvas.height/2-85, canvas.width, 170);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#52e3c2';
    ctx.font = 'bold 2.9rem Segoe UI, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${winner} Wins!`, canvas.width/2, canvas.height/2+20);
    ctx.font = '1.2rem Segoe UI, Arial';
    ctx.fillStyle = '#eebd89';
    ctx.fillText('Click Start to play again', canvas.width/2, canvas.height/2+62);
    ctx.restore();
}

// ---- Game Update ----
function updateScores() {
    playerScoreEl.textContent = playerScore;
    aiScoreEl.textContent = aiScore;
}

function updateGame() {
    playerY += (playerTargetY - playerY) * PADDLE.EASING;
    ballX += ballVelX;
    ballY += ballVelY;

    if (ballY <= 0) {
        ballY = 0;
        ballVelY *= -1;
        playSound(hitSound);
    }
    if (ballY + BALL.SIZE >= canvas.height) {
        ballY = canvas.height - BALL.SIZE;
        ballVelY *= -1;
        playSound(hitSound);
    }

    if (
        ballX <= PLAYER_X + PADDLE.WIDTH &&
        ballY + BALL.SIZE > playerY &&
        ballY < playerY + PADDLE.HEIGHT
    ) {
        ballX = PLAYER_X + PADDLE.WIDTH;
        const relIntersectY = (playerY + PADDLE.HEIGHT/2) - (ballY + BALL.SIZE/2);
        const normalized = relIntersectY / (PADDLE.HEIGHT/2);
        const bounceAngle = normalized * BALL.MAX_ANGLE;
        const speed = Math.sqrt(ballVelX*ballVelX + ballVelY*ballVelY) + BALL.ACCEL;
        ballVelX = speed * Math.cos(bounceAngle);
        ballVelY = -speed * Math.sin(bounceAngle);
        if (ballVelX < 0) ballVelX *= -1;
        playSound(hitSound);
    }

    if (
        ballX + BALL.SIZE >= AI_X &&
        ballY + BALL.SIZE > aiY &&
        ballY < aiY + PADDLE.HEIGHT
    ) {
        ballX = AI_X - BALL.SIZE;
        const relIntersectY = (aiY + PADDLE.HEIGHT/2) - (ballY + BALL.SIZE/2);
        const normalized = relIntersectY / (PADDLE.HEIGHT/2);
        const bounceAngle = normalized * BALL.MAX_ANGLE;
        const speed = Math.sqrt(ballVelX*ballVelX + ballVelY*ballVelY) + BALL.ACCEL;
        ballVelX = -speed * Math.cos(bounceAngle);
        ballVelY = -speed * Math.sin(bounceAngle);
        if (ballVelX > 0) ballVelX *= -1;
        playSound(hitSound);
    }

    if (ballX < 0) {
        aiScore++;
        updateScores();
        playSound(scoreSound);
        if (aiScore >= WIN_SCORE) {
            running = false;
            gameOver = true;
            pauseBtn.disabled = true;
            musicBtn.disabled = false;
            messageEl.textContent = "Game Over!";
            stopMusic();
        } else {
            resetBall(1);
        }
    }
    if (ballX + BALL.SIZE > canvas.width) {
        playerScore++;
        updateScores();
        playSound(scoreSound);
        if (playerScore >= WIN_SCORE) {
            running = false;
            gameOver = true;
            pauseBtn.disabled = true;
            musicBtn.disabled = false;
            messageEl.textContent = "Game Over!";
            stopMusic();
        } else {
            resetBall(-1);
        }
    }

    // AI paddle movement (tracks ball with easing)
    const aiCenter = aiY + PADDLE.HEIGHT/2;
    const ballCenter = ballY + BALL.SIZE/2;
    let delta = ballCenter - aiCenter;
    aiY += Math.sign(delta) * Math.min(Math.abs(delta), PADDLE.SPEED);

    aiY = Math.max(0, Math.min(canvas.height - PADDLE.HEIGHT, aiY));
    playerY = Math.max(0, Math.min(canvas.height - PADDLE.HEIGHT, playerY));
}

// ---- Sound & Music ----
function playSound(audio) {
    audio.currentTime = 0;
    audio.play();
}
function playMusic() {
    if (!isMusicMuted) {
        music.volume = 0.5;
        music.play();
    }
}
function stopMusic() {
    music.pause();
    music.currentTime = 0;
}
function toggleMusic() {
    isMusicMuted = !isMusicMuted;
    musicBtn.textContent = isMusicMuted ? "Unmute Music" : "Mute Music";
    if (isMusicMuted) {
        stopMusic();
    } else {
        playMusic();
    }
}

// ---- Main Game Loop ----
function gameLoop() {
    drawCourt();
    drawPaddles();
    drawBall();
    if (gameOver) {
        drawGameOver(playerScore >= WIN_SCORE ? "Player" : "AI");
        return;
    }
    if (running && !paused) updateGame();
    requestAnimationFrame(gameLoop);
}

// ---- Mouse Controls ----
canvas.addEventListener('mousemove', evt => {
    if (!running || gameOver || paused) return;
    const rect = canvas.getBoundingClientRect();
    const mouseY = evt.clientY - rect.top;
    playerTargetY = mouseY - PADDLE.HEIGHT / 2;
    playerTargetY = Math.max(0, Math.min(canvas.height - PADDLE.HEIGHT, playerTargetY));
});

// ---- Mobile Touch Controls ----
canvas.addEventListener('touchstart', function(e) {
    if (!running || gameOver || paused) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    if (x < canvas.width / 2) {
        touchActive = true;
        handleTouchMove(touch);
        e.preventDefault();
    }
});
canvas.addEventListener('touchmove', function(e) {
    if (!touchActive || !running || gameOver || paused) return;
    const touch = e.touches[0];
    handleTouchMove(touch);
    e.preventDefault();
});
canvas.addEventListener('touchend', function(e) {
    touchActive = false;
});

function handleTouchMove(touch) {
    const rect = canvas.getBoundingClientRect();
    const y = touch.clientY - rect.top;
    playerTargetY = y - PADDLE.HEIGHT / 2;
    playerTargetY = Math.max(0, Math.min(canvas.height - PADDLE.HEIGHT, playerTargetY));
}

// ---- Button Events ----
startBtn.addEventListener('click', () => {
    if (!running) {
        resetGame();
        running = true;
        paused = false;
        pauseBtn.disabled = false;
        pauseBtn.textContent = "Pause";
        musicBtn.disabled = false;
        musicBtn.textContent = isMusicMuted ? "Unmute Music" : "Mute Music";
        messageEl.textContent = "Game in progress...";
        playMusic();
    }
});

pauseBtn.addEventListener('click', () => {
    if (!running || gameOver) return;
    paused = !paused;
    pauseBtn.textContent = paused ? "Resume" : "Pause";
    messageEl.textContent = paused ? "Paused" : "Game in progress...";
    if (paused) stopMusic();
    else playMusic();
});

musicBtn.addEventListener('click', () => {
    if (!running && !gameOver) return;
    toggleMusic();
});

// ---- Start ----
resetGame();
gameLoop();
