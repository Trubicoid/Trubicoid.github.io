// ------------------------
//  Constants & Globals
// ------------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const PLAYER_SPEED = 3;
const TEACHER_SPEED = 2;
const GAME_DURATION = 180; // 3 minutes
const FPS = 60;           // Smoother movement at 60 FPS

// Scales for how big the player/teacher are compared to the tile size
// e.g., 0.7 means the bounding box is 70% of each tile dimension
const PLAYER_SCALE = 0.6;
const TEACHER_SCALE = 0.6;

// We'll stretch the map so it fills the entire canvas, possibly making
// tiles rectangular if the aspect ratio is different.
let tileWidth;    // canvas.width / numberOfCols
let tileHeight;   // canvas.height / numberOfRows

// Player/Teacher bounding boxes
// The "x" and "y" here will always refer to the top-left corner of
// the bounding box, NOT the tile coordinate.
let player = {
  x: 0,
  y: 0,
  width: 0,   // computed at startup
  height: 0,
  hasComputer: false
};

let teacher = {
  x: 0,
  y: 0,
  dx: TEACHER_SPEED,
  dy: 0,
  width: 0,  // computed at startup
  height: 0
};

let computers = [];
let score = 0;
let timeLeft = GAME_DURATION;
let gameRunning = false;
let gameInterval = null;
let timerInterval = null;

// Track held-down keys for smooth movement
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

// HTML references
const scoreDisplay = document.getElementById("score");
const timeLeftDisplay = document.getElementById("timeLeft");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreDisplay = document.getElementById("finalScore");

// --- Map (0=wall, 1=floor, 2=computer, 3=exit) ---
const map = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 2, 0, 1, 1, 1, 1, 1, 1, 0, 2, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
  [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
  [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 2, 1, 0],
  [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 3, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  [0, 2, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

// ------------------------
//   Helper Functions
// ------------------------

/**
 * Returns true if row,col are within the map bounds and not a wall (0).
 */
function isPassableTile(row, col) {
  if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) {
    return false;
  }
  return map[row][col] !== 0; // 0=wall => not passable
}

/**
 * We use a bounding-box approach for collision with walls.
 * The bounding box has top-left at (x, y) and width/height (w, h).
 * We check the corners against the map grid to ensure none are in a wall.
 */
function canMove(x, y, w, h) {
  // Because tileHeight/tileWidth might be different, we handle corners carefully.
  const left = x;
  const right = x + w;
  const top = y;
  const bottom = y + h;

  // Convert each corner to (row, col)
  const topLeftRow = Math.floor(top / tileHeight);
  const topLeftCol = Math.floor(left / tileWidth);

  const topRightRow = Math.floor(top / tileHeight);
  const topRightCol = Math.floor(right / tileWidth);

  const bottomLeftRow = Math.floor(bottom / tileHeight);
  const bottomLeftCol = Math.floor(left / tileWidth);

  const bottomRightRow = Math.floor(bottom / tileHeight);
  const bottomRightCol = Math.floor(right / tileWidth);

  return (
    isPassableTile(topLeftRow, topLeftCol) &&
    isPassableTile(topRightRow, topRightCol) &&
    isPassableTile(bottomLeftRow, bottomLeftCol) &&
    isPassableTile(bottomRightRow, bottomRightCol)
  );
}

/**
 * Quickly check bounding-box overlap between two rectangles A & B
 * with positions and sizes. If they overlap, return true.
 */
function boxesOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return (
    ax < bx + bw &&
    ax + aw > bx &&
    ay < by + bh &&
    ay + ah > by
  );
}

/**
 * Pick a random floor tile to place teacher or player
 * (map[row][col] != 0).
 */
function findRandomFloorPosition(w, h) {
  let row, col;
  do {
    row = Math.floor(Math.random() * map.length);
    col = Math.floor(Math.random() * map[0].length);
  } while (!isPassableTile(row, col));
  // Return top-left bounding box coordinates
  return {
    x: col * tileWidth, 
    y: row * tileHeight
  };
}

/** Draw the map (without computers). */
function drawMap() {
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const tile = map[row][col];
      switch (tile) {
        case 0: ctx.fillStyle = "gray"; break;  // wall
        case 1: ctx.fillStyle = "white"; break; // floor
        case 2: // computer
          ctx.fillStyle = "white"; // treat as floor for painting
          break;
        case 3: // exit
          ctx.fillStyle = "green";
          break;
      }
      ctx.fillRect(col * tileWidth, row * tileHeight, tileWidth, tileHeight);
    }
  }
}

/** Draw all computers as squares. */
function drawComputers() {
  ctx.fillStyle = "blue";
  for (let c of computers) {
    ctx.fillRect(c.x, c.y, tileWidth, tileHeight);
  }
}

/** Draw the player with smaller bounding box in a color. */
function drawPlayer() {
  ctx.fillStyle = player.hasComputer ? "orange" : "red";
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

/** Draw the teacher in purple. */
function drawTeacher() {
  ctx.fillStyle = "purple";
  ctx.fillRect(teacher.x, teacher.y, teacher.width, teacher.height);
}

/** Move teacher randomly, no wall clipping. */
function moveTeacher() {
  let nx = teacher.x + teacher.dx;
  let ny = teacher.y + teacher.dy;

  if (!canMove(nx, ny, teacher.width, teacher.height)) {
    // choose new direction
    const dirs = [
      [TEACHER_SPEED, 0],
      [-TEACHER_SPEED, 0],
      [0, TEACHER_SPEED],
      [0, -TEACHER_SPEED],
    ];
    const r = Math.floor(Math.random() * dirs.length);
    teacher.dx = dirs[r][0];
    teacher.dy = dirs[r][1];
  } else {
    teacher.x = nx;
    teacher.y = ny;
  }
}

/** Move player based on keys, no wall clipping. */
function movePlayer() {
  let nx = player.x;
  let ny = player.y;

  if (keys.ArrowUp)    ny -= PLAYER_SPEED;
  if (keys.ArrowDown)  ny += PLAYER_SPEED;
  if (keys.ArrowLeft)  nx -= PLAYER_SPEED;
  if (keys.ArrowRight) nx += PLAYER_SPEED;

  if (canMove(nx, ny, player.width, player.height)) {
    player.x = nx;
    player.y = ny;
  }
}

/** Collision checks: teacher, computers, exit. */
function checkCollisions() {
  // 1. Teacher collision
  if (boxesOverlap(
    player.x, player.y, player.width, player.height,
    teacher.x, teacher.y, teacher.width, teacher.height
  )) {
    gameOver();
    return; // No need to check more
  }

  // 2. Computers (pickup if player doesn't already have one)
  for (let i = 0; i < computers.length; i++) {
    const c = computers[i];
    // bounding-box overlap with the tile for the computer
    if (boxesOverlap(
      player.x, player.y, player.width, player.height,
      c.x, c.y, tileWidth, tileHeight
    )) {
      if (!player.hasComputer) {
        player.hasComputer = true;
        computers.splice(i, 1);
        score++;
        scoreDisplay.textContent = score;
      }
      break;
    }
  }

  // 3. Check exit if the player has a computer
  if (player.hasComputer) {
    // find the exit tile's row,col
    const exitRow = map.findIndex(r => r.includes(3));
    const exitCol = map[exitRow].indexOf(3);
    // bounding box for that tile
    const exitX = exitCol * tileWidth;
    const exitY = exitRow * tileHeight;

    if (boxesOverlap(
      player.x, player.y, player.width, player.height,
      exitX, exitY, tileWidth, tileHeight
    )) {
      // The player "delivers" the computer
      player.hasComputer = false;
    }
  }
}

// ------------------------
//   Game Loop
// ------------------------
function update() {
  if (!gameRunning) return;
  movePlayer();
  moveTeacher();
  checkCollisions();
  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMap();
  drawComputers();
  drawPlayer();
  drawTeacher();
}

function gameOver() {
  gameRunning = false;
  clearInterval(gameInterval);
  clearInterval(timerInterval);
  finalScoreDisplay.textContent = score;
  gameOverScreen.style.display = "block";
}

function startGame() {
  // Use entire canvas for the map, possibly making rectangular tiles:
  const rows = map.length;
  const cols = map[0].length;
  tileWidth = canvas.width / cols;
  tileHeight = canvas.height / rows;

  // Player & teacher bounding boxes = some fraction of tile size
  player.width = tileWidth * PLAYER_SCALE;
  player.height = tileHeight * PLAYER_SCALE;
  teacher.width = tileWidth * TEACHER_SCALE;
  teacher.height = tileHeight * TEACHER_SCALE;

  // Reset score / time
  score = 0;
  timeLeft = GAME_DURATION;
  scoreDisplay.textContent = score;
  timeLeftDisplay.textContent = timeLeft;
  gameOverScreen.style.display = "none";
  gameRunning = true;

  // Place player near top-left floor, or random:
  // For a guaranteed position, let's forcibly place at (1,1) if it's floor.
  // If that (1,1) is floor:
  if (map[1][1] !== 0) {
    player.x = 1 * tileWidth + (tileWidth - player.width)/2; 
    player.y = 1 * tileHeight + (tileHeight - player.height)/2;
  } else {
    // fallback: random floor
    let pos = findRandomFloorPosition(player.width, player.height);
    // center the bounding box in that tile
    player.x = pos.x + (tileWidth - player.width)/2;
    player.y = pos.y + (tileHeight - player.height)/2;
  }
  player.hasComputer = false;

  // Random teacher spawn
  let tpos = findRandomFloorPosition(teacher.width, teacher.height);
  teacher.x = tpos.x + (tileWidth - teacher.width)/2;
  teacher.y = tpos.y + (tileHeight - teacher.height)/2;
  teacher.dx = TEACHER_SPEED;
  teacher.dy = 0;

  // Rebuild computers array
  computers = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (map[row][col] === 2) {
        computers.push({
          x: col * tileWidth,
          y: row * tileHeight
        });
      }
    }
  }

  // Start loops
  clearInterval(gameInterval);
  gameInterval = setInterval(update, 1000 / FPS);

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (gameRunning) {
      timeLeft--;
      timeLeftDisplay.textContent = timeLeft;
      if (timeLeft <= 0) {
        gameOver();
      }
    }
  }, 1000);

  // Initial draw
  draw();
}

// ------------------------
//   Event Listeners
// ------------------------
document.addEventListener("keydown", (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = true;
  }
});
document.addEventListener("keyup", (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = false;
  }
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

// Draw a blank map before game starts
draw();
