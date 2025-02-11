// ===============================================
//  SONNE UND BETON - BFS Teacher, Exit Moved
//  Teacher stays centered on walkways, invisible
//  wall behind the new exit row
// ===============================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Speeds & Durations
const PLAYER_SPEED  = 2;
const TEACHER_SPEED = 1.5;  // Teacher is a bit faster
const GAME_DURATION = 60;  // 1 minutes
const FPS           = 60;

// Scale bounding boxes relative to tile size
const PLAYER_SCALE  = 0.6;
const TEACHER_SCALE = 0.6;

// We'll fill the entire canvas with the map
let tileWidth, tileHeight;

// Game state
let score = 0;
let timeLeft = GAME_DURATION;
let gameRunning = false;
let gameInterval = null;
let timerInterval = null;

// Track arrow keys
const keys = {ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false};

// Player & Teacher
let player = {
  x:0, y:0,
  width:0, height:0,
  hasComputer:false
};

// Teacher tile-based movement
let teacher = {
  tileRow:0, tileCol:0,
  x:0, y:0,
  width:0, height:0,
  // Next tile center to move toward:
  targetX:0, targetY:0,
  path:[],
  pathIndex:0
};

// Computers
let computers = [];
let totalComputers = 0;
let computersDelivered = 0;

// HTML references
const scoreDisplay      = document.getElementById("score");
const timeLeftDisplay   = document.getElementById("timeLeft");
const gameInfoDiv       = document.getElementById("game-info");
const startButton       = document.getElementById("startButton");
const summaryScreen     = document.getElementById("summaryScreen");
const finalScoreDisplay = document.getElementById("finalScore");
const restartButton     = document.getElementById("restartButton");

// Overlays
const prologueOverlay = document.getElementById("prologueOverlay");
const prologueText    = document.getElementById("prologueText");
const prologueImage   = document.getElementById("prologueImage");

const endOverlay  = document.getElementById("endOverlay");
const endText     = document.getElementById("endText");
const endImage    = document.getElementById("endImage");

// *** MAP ***
// 0=wall, 1=floor, 2=computer, 3=exit
//  Moved exit down by 1 row => row=21, col=11..12 are '3'
//  Row=20 is now normal floor. The last row=21 is partially exit, partially 0
//  This also ensures you can't pass behind the exit because the rest is walls.
const map = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // row0
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
  [0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  [0, 2, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],  // row=20 is normal floor
  // row=21 => partial exit in columns 11..12, everything else is wall
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

// -------------------------------------------------------------------
//   TEXTURES
// -------------------------------------------------------------------
const textures = {
  wall:      "",  // e.g. "images/wall.png"
  floor:     "",  // e.g. "images/floor.png"
  exit:      "",  // e.g. "images/exit.png"
  computer:  "images/pc_hotdog.png",  // e.g. "images/computer.png"
  player:    "",  // e.g. "images/player.png"
  teacher:   "",  // e.g. "images/teacher.png",
  speakers: {
    "Dealer": "",
    "Cem": "",
    "Hasan": ""
  }
};
// We'll store loaded images here
const images = {};

// -------------------------------------------------------------------
//   PROLOGUE & ENDINGS
// -------------------------------------------------------------------
const prologueLines = [
  { speaker:"Dealer", text:"Berlin. 'Sonne und Beton' - hier ist es hart." },
  { speaker:"Dealer", text:"Wenn ihr mir das Geld nicht bis morgen bringt, seid ihr geliefert!"},
  { speaker:"Cem",    text:"Wir haben kein Geld. Wir könnten die Schul-PCs klauen..."},
  { speaker:"Hasan",  text:"Verrückt, aber wir haben keine Wahl!"},
  { speaker:"",       text:"(Ihr beschließt, die Schule auszurauben...)"},
];
let prologueIndex=0;

const endingPolice = [
  { speaker:"Lehrer", text:"Du bist erwischt! Die Polizei kommt!"},
  { speaker:"Dealer", text:"Tja, in 'Sonne und Beton' war das wohl dein Ende..."}
];
const endingDealer = [
  { speaker:"Dealer", text:"Die Zeit ist um und nicht alle PCs da?!"},
  { speaker:"Dealer", text:"Ich mach dich fertig... 'Sonne und Beton' verzeiht nichts."}
];
const endingSuccess = [
  { speaker:"Dealer", text:"Alle PCs?! Respekt... Vielleicht habt ihr noch ne Chance."},
  { speaker:"Dealer", text:"Aber Berlin bleibt hart. Passt auf euch auf..."}
];
let currentEndingLines=[];
let endingIndex=0;

// -------------------------------------------------------------------
//   TEXTURE LOADING
// -------------------------------------------------------------------
function loadAllTextures() {
  function loadImage(key, url) {
    if (!url) return;
    images[key] = new Image();
    images[key].src = url;
  }
  loadImage("wall",      textures.wall);
  loadImage("floor",     textures.floor);
  loadImage("exit",      textures.exit);
  loadImage("computer",  textures.computer);
  loadImage("player",    textures.player);
  loadImage("teacher",   textures.teacher);

  for (let spk in textures.speakers) {
    const spkPath = textures.speakers[spk];
    if (spkPath) {
      let imgKey = "speaker:"+spk;
      images[imgKey] = new Image();
      images[imgKey].src = spkPath;
    }
  }
}

// -------------------------------------------------------------------
//   DRAWING MAP & ENTITIES (using BFS tile approach for teacher)
// -------------------------------------------------------------------
function drawMap() {
  for (let r=0; r<map.length; r++){
    for (let c=0; c<map[r].length; c++){
      const tile= map[r][c];
      const x = c*tileWidth;
      const y = r*tileHeight;

      switch(tile) {
        case 0: // wall
          if (images.wall) {
            ctx.drawImage(images.wall, x, y, tileWidth, tileHeight);
          } else {
            ctx.fillStyle="gray";
            ctx.fillRect(x,y,tileWidth,tileHeight);
          }
          break;
        case 1: // floor
          if (images.floor) {
            ctx.drawImage(images.floor, x, y, tileWidth, tileHeight);
          } else {
            ctx.fillStyle="white";
            ctx.fillRect(x,y,tileWidth,tileHeight);
          }
          break;
        case 2: // computer tile => draw floor behind it
          if (images.floor) {
            ctx.drawImage(images.floor, x, y, tileWidth, tileHeight);
          } else {
            ctx.fillStyle="white";
            ctx.fillRect(x,y,tileWidth,tileHeight);
          }
          break;
        case 3: // exit
          if (images.exit) {
            ctx.drawImage(images.exit, x, y, tileWidth, tileHeight);
          } else {
            ctx.fillStyle="green";
            ctx.fillRect(x,y,tileWidth,tileHeight);
          }
          break;
      }
    }
  }
}

function drawComputers() {
  for (let comp of computers) {
    if (images.computer) {
      ctx.drawImage(images.computer, comp.x, comp.y, tileWidth, tileHeight);
    } else {
      ctx.fillStyle="blue";
      ctx.fillRect(comp.x, comp.y, tileWidth, tileHeight);
    }
  }
}

function drawPlayer() {
  if (images.player) {
    ctx.drawImage(images.player, player.x, player.y, player.width, player.height);
  } else {
    ctx.fillStyle = player.hasComputer? "orange" : "red";
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }
}

function drawTeacher() {
  if (images.teacher) {
    ctx.drawImage(images.teacher, teacher.x, teacher.y, teacher.width, teacher.height);
  } else {
    ctx.fillStyle="purple";
    ctx.fillRect(teacher.x, teacher.y, teacher.width, teacher.height);
  }
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawMap();
  drawComputers();
  drawPlayer();
  drawTeacher();
}

// -------------------------------------------------------------------
//   BFS PATHFINDING for TEACHER
// -------------------------------------------------------------------
function isWall(row, col) {
  if (row<0 || row>=map.length || col<0 || col>=map[0].length) return true;
  return (map[row][col]===0);
}
function isFloor(row,col) {
  // passable if not wall
  return !isWall(row,col) && row<map.length && col<map[0].length;
}
/**
 * BFS from teacher tile to player's tile
 * We expand neighbors in a stable order => Up, Left, Right, Down
 * to reduce random tie-breaking
 */
function bfsPath(sr, sc, tr, tc) {
    console.log(`bfsPath called: start=(${sr}, ${sc}), target=(${tr}, ${tc})`);
    if (sr === tr && sc === tc) {
        console.log("Start and target are the same. Returning trivial path.");
        return [{ row: sr, col: sc }];
    }

    const visited = Array.from({ length: map.length }, () => Array(map[0].length).fill(false));
    visited[sr][sc] = true;

    let queue = [{ row: sr, col: sc, parent: null }];
    // stable neighbor order => up, left, right, down
    const deltas = [
        { dr: -1, dc: 0 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 }
    ];

    while (queue.length > 0) {
        let cur = queue.shift();
        console.log(`  Visiting: (${cur.row}, ${cur.col})`);

        if (cur.row === tr && cur.col === tc) {
            // reconstruct path
            console.log("    Target reached. Reconstructing path...");
            let path = [];
            while (cur) {
                path.unshift({ row: cur.row, col: cur.col });
                cur = cur.parent;
            }
            console.log("    Path found:", path);
            return path;
        }

        for (let d of deltas) {
            let nr = cur.row + d.dr;
            let nc = cur.col + d.dc;
            if (nr >= 0 && nr < map.length && nc >= 0 && nc < map[0].length &&
                isFloor(nr, nc) && !visited[nr][nc]) {
                console.log(`    Adding neighbor to queue: (${nr}, ${nc})`);
                visited[nr][nc] = true;
                queue.push({ row: nr, col: nc, parent: cur });
            } else {
                console.log(`    Neighbor (${nr}, ${nc}) is invalid or visited.`);
            }
        }
    }
    console.log("No path found.");
    return [];
}


function tileCenter(row,col) {
  return {
    x: col*tileWidth + tileWidth/2,
    y: row*tileHeight + tileHeight/2
  };
}

// -------------------------------------------------------------------
//   MOVEMENT & COLLISIONS
// -------------------------------------------------------------------
function canMove(x,y,w,h) {
  let left= x, right= x+w;
  let top= y, bottom= y+h;

  let rowTop    = Math.floor(top/tileHeight);
  let colLeft   = Math.floor(left/tileWidth);
  let rowBottom = Math.floor(bottom/tileHeight);
  let colRight  = Math.floor(right/tileWidth);

  // Must not be a wall => we treat 1,2,3 as floor
  return isFloor(rowTop,colLeft) && isFloor(rowTop,colRight) &&
         isFloor(rowBottom,colLeft) && isFloor(rowBottom,colRight);
}

function movePlayer() {
  let nx= player.x;
  let ny= player.y;
  if (keys.ArrowUp)    ny-= PLAYER_SPEED;
  if (keys.ArrowDown)  ny+= PLAYER_SPEED;
  if (keys.ArrowLeft)  nx-= PLAYER_SPEED;
  if (keys.ArrowRight) nx+= PLAYER_SPEED;

  if (canMove(nx,ny, player.width,player.height)) {
    player.x= nx;
    player.y= ny;
  }
}

/**
 * Teacher moves from tile center to tile center.  We do NOT re-check BFS
 * in the middle. We only recalc BFS once teacher arrives at the end
 * of its current path, or if we decide to recalc each time it arrives
 * at a tile center. Here, we recalc BFS each time teacher finishes
 * the last path tile (for a simpler approach).
 */
function moveTeacher() {
    console.log(`moveTeacher called. Current position: (${teacher.x}, ${teacher.y}), target: (${teacher.targetX}, ${teacher.targetY}), pathIndex: ${teacher.pathIndex}, path:`, teacher.path);

    // 1. Update tile coordinates *before* moving.  This is important!
    let cx = teacher.x + teacher.width / 2;
    let cy = teacher.y + teacher.height / 2;
    teacher.tileRow = Math.floor(cy / tileHeight);
    teacher.tileCol = Math.floor(cx / tileWidth);
    console.log(`  Updated tileRow: ${teacher.tileRow}, tileCol: ${teacher.tileCol}`);

    // 2. Check if we've *reached the center* of the current target tile.
    //    Use tileRow/tileCol for this, NOT pixel coordinates.
    if (teacher.path && teacher.path.length > 0 && teacher.pathIndex < teacher.path.length) {
        let currentTargetTile = teacher.path[teacher.pathIndex];

        if (teacher.tileRow === currentTargetTile.row && teacher.tileCol === currentTargetTile.col) {
            // We're at the center of the current target tile.
            console.log(`  Reached center of target tile: (${teacher.tileRow}, ${teacher.tileCol})`);

            // 3. Advance to the *next* tile in the path.
            teacher.pathIndex++;

            if (teacher.pathIndex < teacher.path.length) {
                let nextTargetTile = teacher.path[teacher.pathIndex];
                let center = tileCenter(nextTargetTile.row, nextTargetTile.col);
                teacher.targetX = center.x - teacher.width / 2;
                teacher.targetY = center.y - teacher.height / 2;
                console.log(`  Moving to next path index: ${teacher.pathIndex}, New target: (${teacher.targetX}, ${teacher.targetY})`);
            } else {
                // Path complete. Recalculate.
                console.log("  Path complete. Recalculating...");
                updateTeacherPath();
                return; // IMPORTANT:  Exit here after recalculating.
            }
        }
    } else {
          //No path , Recalculate.
          console.log("  no path. Recalculating...");
          updateTeacherPath();
          return; // IMPORTANT:  Exit here after recalculating.

    }


    // 4.  Move towards the targetX/targetY.  This part remains mostly the same.
    let dx = teacher.targetX - teacher.x;
    let dy = teacher.targetY - teacher.y;
    let dist = distance(teacher.x, teacher.y, teacher.targetX, teacher.targetY);
    console.log(`  Moving towards target. dx: ${dx}, dy: ${dy}, dist: ${dist}`);

    if (dist > 0) {
        let stepX = (dx / dist) * TEACHER_SPEED;
        let stepY = (dy / dist) * TEACHER_SPEED;

        // 5. Prevent overshooting:  Clamp the movement.
        if (Math.abs(stepX) > Math.abs(dx)) {
            stepX = dx;
        }
        if (Math.abs(stepY) > Math.abs(dy)) {
            stepY = dy;
        }

        teacher.x += stepX;
        teacher.y += stepY;
        console.log(`    New position: (${teacher.x}, ${teacher.y})`);
    }
}
function distance(x1,y1,x2,y2) {
  let dx= x2-x1, dy= y2-y1;
  return Math.sqrt(dx*dx + dy*dy);
}

/** Recalc BFS from teacher tile to player's tile. */
function updateTeacherPath() {
    console.log("updateTeacherPath called");
    let sr = teacher.tileRow, sc = teacher.tileCol;
    let px = player.x + player.width / 2;
    let py = player.y + player.height / 2;
    let pr = Math.floor(py / tileHeight), pc = Math.floor(px / tileWidth);
    console.log(`  Teacher tile: (${sr}, ${sc}), Player tile: (${pr}, ${pc})`);


    let path = bfsPath(sr, sc, pr, pc);
    teacher.path = path;
    teacher.pathIndex = 0; // Reset path index

    if (path.length > 1) {
      // Start moving towards the *second* element in the path
      // (the first is the teacher's current tile).
        teacher.pathIndex = 1;
        let next = path[1];
        let center = tileCenter(next.row, next.col);
        teacher.targetX = center.x - teacher.width / 2;
        teacher.targetY = center.y - teacher.height / 2;
        console.log(`  New path calculated.  Target: (${teacher.targetX}, ${teacher.targetY})`);

    } else {
        // no path or trivial path
        console.log("  No path, or trivial path.");
        teacher.targetX = teacher.x; // Stay put
        teacher.targetY = teacher.y;
    }
}


// For bounding-box overlap
function boxesOverlap(ax,ay,aw,ah, bx,by,bw,bh) {
  return (
    ax<bx+bw &&
    ax+aw>bx &&
    ay<by+bh &&
    ay+ah>by
  );
}

function checkCollisions() {
  // Teacher vs Player => ending 1 (police)
  if (boxesOverlap(
    player.x, player.y, player.width, player.height,
    teacher.x, teacher.y, teacher.width, teacher.height
  )) {
    endGame(1);
    return;
  }

  // Player vs Computers => pick up
  for(let i=0; i<computers.length; i++){
    let c= computers[i];
    if (boxesOverlap(player.x, player.y, player.width, player.height,
                     c.x, c.y, tileWidth, tileHeight)) {
      if(!player.hasComputer) {
        player.hasComputer= true;
        computers.splice(i,1);
        score++;
        scoreDisplay.textContent=score;
      }
      break;
    }
  }

  // If carrying, check exit
  if(player.hasComputer) {
    let delivered= false;
    for(let r=0; r<map.length; r++){
      for(let c=0; c<map[r].length; c++){
        if(map[r][c]===3) {
          let ex= c*tileWidth;
          let ey= r*tileHeight;
          if(boxesOverlap(
            player.x,player.y, player.width,player.height,
            ex,ey, tileWidth,tileHeight
          )) {
            delivered=true;
            break;
          }
        }
      }
      if(delivered) break;
    }
    if(delivered) {
      player.hasComputer=false;
      computersDelivered++;
      // If all stolen => success
      if(computersDelivered>= totalComputers) {
        endGame(3);
      }
    }
  }
}

// -------------------------------------------------------------------
//   ENDGAME / ENDINGS
// -------------------------------------------------------------------
function endGame(type) {
  if(!gameRunning) return;
  gameRunning=false;
  clearInterval(gameInterval);
  clearInterval(timerInterval);

  switch(type) {
    case 1: currentEndingLines= endingPolice;  break;
    case 2: currentEndingLines= endingDealer;  break;
    case 3: currentEndingLines= endingSuccess; break;
  }
  endingIndex=0;
  updateEndingUI();
  endOverlay.style.display="flex";
}

function updateEndingUI() {
  if(endingIndex< currentEndingLines.length) {
    const line= currentEndingLines[endingIndex];
    const spkKey= "speaker:"+ line.speaker;
    if(line.speaker && images[spkKey]) {
      endImage.style.display="block";
      endImage.src= images[spkKey].src;
    } else {
      endImage.style.display="none";
    }
    endText.innerText= (line.speaker ? (line.speaker+": ") : "") + line.text;
  } else {
    // done => summary
    endOverlay.style.display="none";
    finalScoreDisplay.textContent= score;
    summaryScreen.style.display="block";
  }
}
endOverlay.addEventListener("click", ()=>{
  endingIndex++;
  updateEndingUI();
});

// -------------------------------------------------------------------
//   MAIN LOOP
// -------------------------------------------------------------------
function update() {
  if(!gameRunning) return;
  movePlayer();
  moveTeacher();
  checkCollisions();
  draw();
}

// -------------------------------------------------------------------
//   START / RESTART
// -------------------------------------------------------------------
function startGame() {
  prologueOverlay.style.display="none";
  endOverlay.style.display="none";
  summaryScreen.style.display="none";
  startButton.style.display="none";

  gameInfoDiv.style.display="block";

  // Fill entire canvas
  const rows= map.length;
  const cols= map[0].length;
  tileWidth  = canvas.width / cols;
  tileHeight = canvas.height/ rows;

  // Reset
  score=0; 
  timeLeft= GAME_DURATION;
  computersDelivered=0;
  gameRunning=true;
  scoreDisplay.textContent= score;
  timeLeftDisplay.textContent= timeLeft;

  // Build computers array
  totalComputers=0;
  computers=[];
  for(let r=0; r<rows; r++){
    for(let c=0; c<cols; c++){
      if(map[r][c]===2) {
        totalComputers++;
        computers.push({ 
          x:c*tileWidth, 
          y:r*tileHeight
        });
      }
    }
  }

  // Player bounding box
  player.width = tileWidth* PLAYER_SCALE;
  player.height= tileHeight* PLAYER_SCALE;
  player.hasComputer=false;

  // place player at (1,1) or random
  if(map[1][1]!==0) {
    player.x= 1*tileWidth+(tileWidth - player.width)/2;
    player.y= 1*tileHeight+(tileHeight- player.height)/2;
  } else {
    let ppos= randomFloorPosition();
    player.x= ppos.x + (tileWidth - player.width)/2;
    player.y= ppos.y + (tileHeight- player.height)/2;
  }

  // Teacher bounding box
  teacher.width= tileWidth*TEACHER_SCALE;
  teacher.height= tileHeight*TEACHER_SCALE;

  let tpos= randomFloorPosition();
  teacher.x= tpos.x + (tileWidth- teacher.width)/2;
  teacher.y= tpos.y + (tileHeight- teacher.height)/2;

  let tcenterX= teacher.x + teacher.width/2;
  let tcenterY= teacher.y + teacher.height/2;
  teacher.tileRow= Math.floor(tcenterY / tileHeight);
  teacher.tileCol= Math.floor(tcenterX / tileWidth);
  teacher.path= [];
  teacher.pathIndex=0;
  teacher.targetX= teacher.x;
  teacher.targetY= teacher.y;

  // Timers
  clearInterval(gameInterval);
  gameInterval= setInterval(update, 1000/FPS);

  clearInterval(timerInterval);
  timerInterval= setInterval(()=>{
    if(!gameRunning) return;
    timeLeft--;
    timeLeftDisplay.textContent= timeLeft;
    if(timeLeft<=0) {
      // not all stolen => dealer =2
      if(computersDelivered< totalComputers) endGame(2);
      else endGame(3);
    }
  },1000);

  // initial BFS
  updateTeacherPath();
  draw();
}

function randomFloorPosition() {
  let row, col;
  do {
    row= Math.floor(Math.random()* map.length);
    col= Math.floor(Math.random()* map[0].length);
  } while(!isFloor(row,col));
  return { x:col*tileWidth, y:row*tileHeight };
}

// -------------------------------------------------------------------
//   PROLOGUE
// -------------------------------------------------------------------
function showPrologue() {
  prologueOverlay.style.display= "flex";
  prologueIndex=0;
  updatePrologueUI();
}
function updatePrologueUI() {
  if(prologueIndex< prologueLines.length) {
    const line= prologueLines[prologueIndex];
    const spkKey= "speaker:"+ line.speaker;
    if(line.speaker && images[spkKey]) {
      prologueImage.style.display="block";
      prologueImage.src= images[spkKey].src;
    } else {
      prologueImage.style.display="none";
    }
    prologueText.innerText= (line.speaker ? (line.speaker+": ") : "") + line.text;
  } else {
    // done
    prologueOverlay.style.display="none";
    startButton.style.display="inline-block";
  }
}
prologueOverlay.addEventListener("click", ()=>{
  prologueIndex++;
  updatePrologueUI();
});

// -------------------------------------------------------------------
//   EVENT LISTENERS
// -------------------------------------------------------------------
document.addEventListener("keydown", (e)=>{
  if(keys.hasOwnProperty(e.key)) {
    keys[e.key]=true;
  }
});
document.addEventListener("keyup", (e)=>{
  if(keys.hasOwnProperty(e.key)) {
    keys[e.key]=false;
  }
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", ()=>{
  summaryScreen.style.display="none";
  // Optionally show the prologue again, or skip
  // showPrologue();
  startGame();
});

// -------------------------------------------------------------------
//   INIT
// -------------------------------------------------------------------
function init() {
  loadAllTextures(); // Attempt to load any custom images
  showPrologue();    // Show multi-line prologue
  draw();            // Initial blank
}
init();
