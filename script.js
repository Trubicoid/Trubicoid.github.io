// ===============================================
//  SONNE UND BETON - BFS Teacher, Snap Fix
//  Teacher stays centered, exit is row21 col(11..12)
// ===============================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Speeds & Durations
const PLAYER_SPEED  = 2;
const TEACHER_SPEED = 1.5; // Slightly faster than player
const GAME_DURATION = 80;  // 1 minute
const FPS           = 60;

// Scale bounding boxes relative to tile size
const PLAYER_SCALE  = 0.6;
const TEACHER_SCALE = 0.6;

let tileWidth, tileHeight;

// Game state
let score = 0;
let timeLeft = GAME_DURATION;
let gameRunning = false;
let gameInterval = null;
let timerInterval = null;

// Track arrow keys
const keys = {
  ArrowUp:false,
  ArrowDown:false,
  ArrowLeft:false,
  ArrowRight:false
};

// Player & Teacher
let player = {
  x:0, y:0,
  width:0, height:0,
  hasComputer:false
};

let teacher = {
  tileRow:0, tileCol:0,
  x:0, y:0,
  width:0, height:0,
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
// Row=21 => partial exit in columns 11..12, everything else is 0
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
  [0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  [0, 2, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  // row=21 => partial exit in columns 11..12, everything else is wall
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

// Textures (optional).  Feel free to provide your own image paths
const textures = {
  wall:      "",
  floor:     "images/floor.jpg",
  exit:      "",
  computer:  "images/pc_hotdog.png",
  player:    "images/lukas.jpg",
  teacher:   "", // e.g. "images/teacher.png"
  speakers: {
    "Dealer": "",
    "Cem":    "",
    "Hasan":  "",
    "Lukas":  "",
    "Sanchez":""
  }
};
const images = {};

// Prologue
const prologueLines = [
  { speaker:"Lukas", text:"Schon wieder so ein Mist-Tag... Aber hey, neue Computer in der Schule!" },
  { speaker:"Sanchez", text:"Genau die richtigen, um sie zu schnappen. Ich hab 'nen Schlüssel..." },
  { speaker:"Lukas", text:"Bist du verrückt? Das fliegt doch auf!" },
  { speaker:"Sanchez", text:"Keine Sorge, ich hab' einen Plan. Wir machen das heute Nacht."},
  { speaker:"Lukas", text:"(Will zuerst nicht mitkommen, trotzdem beschliesst er schliesslich mitzumachen...)"},
  { speaker:"Anleitung", text:"(Klaut die Computer und bringt sie zum Ausgang. Zeit: 80s, man kann nur 1 Computer aufeinmal tragen.)"}
];
let prologueIndex=0;

// Endings
const endingPolice = [
  { speaker:"Lehrer", text:"Ihr habt die Computer geklaut! Die Polizei ist schon unterwegs!"},
  { speaker:"Lukas",  text:"Verdammt, alles ist aus..."}
];
const endingDealer = [
  { speaker:"Polizist", text:"Ihr wart zu langsam – jemand hat uns gerufen!"},
  { speaker:"Lukas", text:"Mist, wir hätten vorsichtiger sein sollen..."}
];
const endingSuccess = [
  { speaker:"Sanchez", text:"Geschafft! Alle Computer weg, bevor jemand was merkt."},
  { speaker:"Lukas",   text:"Krass... Aber das machen wir nie wieder!"}
];
let currentEndingLines=[];
let endingIndex=0;

// ----------------------
//  LOAD TEXTURES
// ----------------------
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

// ----------------------
//  DRAWING
// ----------------------
function drawMap() {
  for (let r=0; r<map.length; r++){
    for (let c=0; c<map[r].length; c++){
      const tile= map[r][c];
      const x = c*tileWidth;
      const y = r*tileHeight;

      switch(tile) {
        case 0: // wall
          if (images.wall) {
            ctx.drawImage(images.wall, x,y, tileWidth,tileHeight);
          } else {
            ctx.fillStyle="gray";
            ctx.fillRect(x,y,tileWidth,tileHeight);
          }
          break;
        case 1: // floor
          if (images.floor) {
            ctx.drawImage(images.floor, x,y, tileWidth,tileHeight);
          } else {
            ctx.fillStyle="white";
            ctx.fillRect(x,y,tileWidth,tileHeight);
          }
          break;
        case 2: // floor w/ computer
          if (images.floor) {
            ctx.drawImage(images.floor, x,y, tileWidth,tileHeight);
          } else {
            ctx.fillStyle="white";
            ctx.fillRect(x,y,tileWidth,tileHeight);
          }
          break;
        case 3: // exit
          if (images.exit) {
            ctx.drawImage(images.exit, x,y, tileWidth,tileHeight);
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
    if(images.computer) {
      ctx.drawImage(images.computer, comp.x, comp.y, tileWidth, tileHeight);
    } else {
      ctx.fillStyle="blue";
      ctx.fillRect(comp.x, comp.y, tileWidth, tileHeight);
    }
  }
}
function drawPlayer() {
  if(images.player) {
    ctx.drawImage(images.player, player.x, player.y, player.width, player.height);
  } else {
    ctx.fillStyle= player.hasComputer? "orange":"red";
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }
}
function drawTeacher() {
  if(images.teacher) {
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

// ----------------------
//  BFS HELPER
// ----------------------
function isWall(row,col) {
  if(row<0 || row>=map.length || col<0 || col>=map[0].length) return true;
  return map[row][col]===0;
}
function isFloor(row,col) {
  return !isWall(row,col);
}
function bfsPath(sr, sc, tr, tc) {
  // If same tile, trivial
  if(sr===tr && sc===tc) {
    return [{row:sr, col:sc}];
  }
  const visited = Array.from({length:map.length}, ()=> Array(map[0].length).fill(false));
  visited[sr][sc]=true;

  let queue = [{row:sr, col:sc, parent:null}];
  // stable neighbor order => up, left, right, down
  const deltas = [
    {dr:-1, dc:0},
    {dr:0,  dc:-1},
    {dr:0,  dc:1},
    {dr:1,  dc:0}
  ];

  while(queue.length>0) {
    let cur= queue.shift();
    if(cur.row===tr && cur.col===tc) {
      let path=[];
      while(cur){
        path.unshift({row:cur.row, col:cur.col});
        cur=cur.parent;
      }
      return path;
    }
    for(let d of deltas){
      let nr= cur.row+d.dr, nc= cur.col+d.dc;
      if(nr>=0 && nr<map.length && nc>=0 && nc<map[0].length &&
         isFloor(nr,nc) && !visited[nr][nc]) {
        visited[nr][nc]=true;
        queue.push({row:nr, col:nc, parent:cur});
      }
    }
  }
  return [];
}
function tileCenter(r,c) {
  return {
    x: c*tileWidth + tileWidth/2,
    y: r*tileHeight + tileHeight/2
  };
}
function distance(x1,y1,x2,y2) {
  let dx=x2-x1, dy=y2-y1;
  return Math.sqrt(dx*dx+dy*dy);
}

// ----------------------
//  MOVEMENT & COLLISION
// ----------------------
function canMove(x,y,w,h) {
  let left= x, right= x+w;
  let top= y, bottom= y+h;

  let rowTop    = Math.floor(top/tileHeight);
  let colLeft   = Math.floor(left/tileWidth);
  let rowBottom = Math.floor(bottom/tileHeight);
  let colRight  = Math.floor(right/tileWidth);

  return (
    isFloor(rowTop,colLeft)   &&
    isFloor(rowTop,colRight)  &&
    isFloor(rowBottom,colLeft)&&
    isFloor(rowBottom,colRight)
  );
}

function movePlayer() {
  let nx= player.x, ny= player.y;
  if(keys.ArrowUp)    ny-= PLAYER_SPEED;
  if(keys.ArrowDown)  ny+= PLAYER_SPEED;
  if(keys.ArrowLeft)  nx-= PLAYER_SPEED;
  if(keys.ArrowRight) nx+= PLAYER_SPEED;

  if(canMove(nx,ny, player.width, player.height)) {
    player.x= nx;
    player.y= ny;
  }
}

/**  
 * The teacher moves tile-by-tile. We snap to tile center if close enough
 * (teacher < TEACHER_SPEED + 1 away from target). Then we update BFS if the path is done.
 */
function moveTeacher() {
  // 1) Determine teacher's current tile from center
  let centerX= teacher.x + teacher.width/2;
  let centerY= teacher.y + teacher.height/2;
  teacher.tileRow= Math.floor(centerY / tileHeight);
  teacher.tileCol= Math.floor(centerX / tileWidth);

  // 2) If we do have a path, check if we're at the correct tile center.
  if(teacher.path && teacher.pathIndex< teacher.path.length) {
    let currentTile= teacher.path[teacher.pathIndex];
    // Are we on the correct tile row/col?
    if(teacher.tileRow=== currentTile.row && teacher.tileCol=== currentTile.col) {
      // Move to next tile
      teacher.pathIndex++;
      if(teacher.pathIndex< teacher.path.length) {
        let nextTile= teacher.path[teacher.pathIndex];
        let tc= tileCenter(nextTile.row, nextTile.col);
        teacher.targetX= tc.x - teacher.width/2;
        teacher.targetY= tc.y - teacher.height/2;
      } else {
        // End of path => recalc BFS
        updateTeacherPath();
        return;
      }
    }
  } else {
    // No path => BFS
    updateTeacherPath();
    return;
  }

  // 3) Move teacher gradually toward teacher.targetX,Y
  let dx= teacher.targetX - teacher.x;
  let dy= teacher.targetY - teacher.y;
  let dist= distance(teacher.x, teacher.y, teacher.targetX, teacher.targetY);
  if(dist>0) {
    // If we're within TEACHER_SPEED+1, snap all the way to avoid "few px away" gap
    if(dist<= TEACHER_SPEED+1) {
      teacher.x= teacher.targetX;
      teacher.y= teacher.targetY;
    } else {
      let stepX= (dx/dist)* TEACHER_SPEED;
      let stepY= (dy/dist)* TEACHER_SPEED;
      teacher.x+= stepX;
      teacher.y+= stepY;
    }
  }
}

// BFS recalc
function updateTeacherPath() {
  // Find teacher tile
  let tCx= teacher.x + teacher.width/2;
  let tCy= teacher.y + teacher.height/2;
  let sr= Math.floor(tCy/tileHeight);
  let sc= Math.floor(tCx/tileWidth);

  // Player tile
  let pCx= player.x + player.width/2;
  let pCy= player.y + player.height/2;
  let tr= Math.floor(pCy/tileHeight);
  let tc= Math.floor(pCx/tileWidth);

  let path= bfsPath(sr, sc, tr, tc);
  teacher.path= path;
  teacher.pathIndex=0;
  if(path.length>1) {
    // Next tile is path[1]
    let next= path[1];
    let c= tileCenter(next.row, next.col);
    teacher.targetX= c.x - teacher.width/2;
    teacher.targetY= c.y - teacher.height/2;
  } else {
    // trivial
    teacher.targetX= teacher.x;
    teacher.targetY= teacher.y;
  }
}

// Overlap check
function boxesOverlap(ax,ay,aw,ah, bx,by,bw,bh){
  return(
    ax< bx+bw &&
    ax+aw>bx &&
    ay< by+bh &&
    ay+ah>by
  );
}

function checkCollisions() {
  // 1) teacher vs player bounding-box
  if(boxesOverlap(player.x,player.y,player.width,player.height,
                  teacher.x,teacher.y,teacher.width,teacher.height)) {
    endGame(1);
    return;
  }

  // 2) If they share the same tile, that also indicates the teacher effectively "caught" the player
  let playerCenterX= player.x+ player.width/2;
  let playerCenterY= player.y+ player.height/2;
  let pRow= Math.floor(playerCenterY/tileHeight);
  let pCol= Math.floor(playerCenterX/tileWidth);

  if(teacher.tileRow===pRow && teacher.tileCol===pCol) {
    // Double-check bounding box overlap or just instantly end
    endGame(1);
    return;
  }

  // 3) Player vs computers => pick up
  for(let i=0; i<computers.length; i++){
    let c= computers[i];
    if(boxesOverlap(player.x,player.y,player.width,player.height,
                    c.x,c.y,tileWidth,tileHeight)) {
      if(!player.hasComputer) {
        player.hasComputer=true;
        computers.splice(i,1);
        score++;
        scoreDisplay.textContent=score;
      }
      break;
    }
  }

  // 4) If carrying, check exit
  if(player.hasComputer) {
    let delivered=false;
    for(let r=0; r<map.length; r++){
      for(let c=0; c<map[r].length; c++){
        if(map[r][c]===3) {
          let ex=c*tileWidth, ey=r*tileHeight;
          if(boxesOverlap(player.x,player.y,player.width,player.height,
                          ex,ey, tileWidth,tileHeight)){
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
      if(computersDelivered>= totalComputers) {
        endGame(3);
      }
    }
  }
}

// ----------------------
//   ENDING
// ----------------------
function endGame(type){
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
function updateEndingUI(){
  if(endingIndex< currentEndingLines.length){
    let line= currentEndingLines[endingIndex];
    let spkKey= "speaker:"+ line.speaker;
    if(line.speaker && images[spkKey]){
      endImage.style.display="block";
      endImage.src= images[spkKey].src;
    } else {
      endImage.style.display="none";
    }
    endText.innerText= (line.speaker ? (line.speaker+": ") : "") + line.text;
  } else {
    endOverlay.style.display="none";
    finalScoreDisplay.textContent= score;
    summaryScreen.style.display="block";
  }
}
endOverlay.addEventListener("click", ()=>{
  endingIndex++;
  updateEndingUI();
});

// ----------------------
//   MAIN LOOP
// ----------------------
function update(){
  if(!gameRunning) return;
  movePlayer();
  moveTeacher();
  checkCollisions();
  draw();
}

// ----------------------
//   START / RESTART
// ----------------------
function startGame(){
  prologueOverlay.style.display="none";
  endOverlay.style.display="none";
  summaryScreen.style.display="none";
  startButton.style.display="none";

  gameInfoDiv.style.display="block";

  const rows= map.length;
  const cols= map[0].length;
  tileWidth  = canvas.width / cols;
  tileHeight = canvas.height/ rows;

  score=0;
  timeLeft= GAME_DURATION;
  computersDelivered=0;
  gameRunning=true;
  scoreDisplay.textContent= score;
  timeLeftDisplay.textContent= timeLeft;

  // Build computers
  totalComputers=0;
  computers=[];
  for(let r=0; r<rows; r++){
    for(let c=0; c<cols; c++){
      if(map[r][c]===2) {
        totalComputers++;
        computers.push({
          x: c*tileWidth,
          y: r*tileHeight
        });
      }
    }
  }

  // Player bounding box
  player.width= tileWidth* PLAYER_SCALE;
  player.height= tileHeight* PLAYER_SCALE;
  player.hasComputer=false;

  // place player at (1,1) if not wall
  if(map[1][1]!==0){
    player.x= 1*tileWidth+(tileWidth-player.width)/2;
    player.y= 1*tileHeight+(tileHeight-player.height)/2;
  } else {
    let ppos= randomFloorPosition();
    player.x= ppos.x+ (tileWidth-player.width)/2;
    player.y= ppos.y+ (tileHeight-player.height)/2;
  }

  // Teacher bounding box
  teacher.width= tileWidth* TEACHER_SCALE;
  teacher.height= tileHeight* TEACHER_SCALE;
  let tpos= randomFloorPosition();
  teacher.x= tpos.x+ (tileWidth-teacher.width)/2;
  teacher.y= tpos.y+ (tileHeight-teacher.height)/2;

  let tcenterX= teacher.x+ teacher.width/2;
  let tcenterY= teacher.y+ teacher.height/2;
  teacher.tileRow= Math.floor(tcenterY/tileHeight);
  teacher.tileCol= Math.floor(tcenterX/tileWidth);
  teacher.path=[];
  teacher.pathIndex=0;
  teacher.targetX= teacher.x;
  teacher.targetY= teacher.y;

  clearInterval(gameInterval);
  gameInterval= setInterval(update, 1000/FPS);

  clearInterval(timerInterval);
  timerInterval= setInterval(()=>{
    if(!gameRunning) return;
    timeLeft--;
    timeLeftDisplay.textContent= timeLeft;
    if(timeLeft<=0) {
      if(computersDelivered< totalComputers) endGame(2);
      else endGame(3);
    }
  },1000);

  // initial BFS
  updateTeacherPath();
  draw();
}

function randomFloorPosition(){
  let row, col;
  do{
    row= Math.floor(Math.random()* map.length);
    col= Math.floor(Math.random()* map[0].length);
  }while(!isFloor(row,col));
  return { x: col*tileWidth, y: row*tileHeight };
}

// ----------------------
//  PROLOGUE
// ----------------------
function showPrologue(){
  prologueOverlay.style.display="flex";
  prologueIndex=0;
  updatePrologueUI();
}
function updatePrologueUI(){
  if(prologueIndex< prologueLines.length){
    let line= prologueLines[prologueIndex];
    let spkKey= "speaker:"+ line.speaker;
    if(line.speaker && images[spkKey]){
      prologueImage.style.display="block";
      prologueImage.src= images[spkKey].src;
    } else {
      prologueImage.style.display="none";
    }
    prologueText.innerText= (line.speaker? (line.speaker+": ") :"") + line.text;
  } else {
    prologueOverlay.style.display="none";
    startButton.style.display="inline-block";
  }
}
prologueOverlay.addEventListener("click", ()=>{
  prologueIndex++;
  updatePrologueUI();
});

// ----------------------
//   EVENT
// ----------------------
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", ()=>{
  summaryScreen.style.display="none";
  startGame();
});
document.addEventListener("keydown", e=>{
  if(keys.hasOwnProperty(e.key)) keys[e.key]=true;
});
document.addEventListener("keyup", e=>{
  if(keys.hasOwnProperty(e.key)) keys[e.key]=false;
});

// ----------------------
//   INIT
// ----------------------
function init(){
  loadAllTextures();
  showPrologue();
  draw();
}
init();
