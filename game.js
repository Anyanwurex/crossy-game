const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const COLS = 9, ROWS = 15;
const playerSize = 36;
const playerColor = "blue";
let gap = 2;
const sidewalksize = 1;
const topsidewalksize = 4;

canvas.width = COLS * playerSize;
canvas.height = ROWS * playerSize;

let player = [ROWS-1,Math.floor(COLS/2)]
let grid = [];
let dirs = [];

let lives = 5;
const GOALNUMBER = 5;
let goals = 0;

let gameOver = false;
let haveWon = false;

function initGrid() {
  grid = [];
  dirs = [];
  for (var r = 0; r < ROWS; r++) {
    let row = [];
    dirs[r] = r % 2 == 0 ? 1 : -1;
    
    if (r >= ROWS - sidewalksize || r < topsidewalksize ) {
      for (var c = 0; c < COLS; c++ ) row.push(0);
      grid.push(row);
      continue;
    }
    
    // generate until not full and not empty
    do {
      row = [];
      for (var c = 0; c < COLS; c++) {
        row.push(Math.random() > 0.6 ? 1 : 0);
      }
    } while (row.every(v => v == 1) || row.every(v => v == 0));
    grid.push(row);
  }
    
}
initGrid();

let lastDrop = 0;
let speedInMs = 400 - goals * 20;
function gameLoop(time) {
  draw();
  if (time-lastDrop >= speedInMs) {
    lastDrop = time;
    update()
  };
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

function update() {
  if (gameOver || haveWon) return;

  // move cars 
  for (var r = topsidewalksize; r < ROWS - sidewalksize; r++) {
    if (dirs[r] == 1) {
      // move RIGHT
      let lastCar = grid[r][COLS-1];
      for (var c = COLS-1; c >= 0; c--) {
        if (c == 0) {
          grid[r][c] = lastCar;
          continue;
        }
        grid[r][c] = grid[r][c-1];
      }
    } else {
      // move LEFT
      let firstCar = grid[r][0];
      for (var c = 0; c < COLS-1; c++) {
        grid[r][c] = grid[r][c+1];
      }
      grid[r][COLS-1] = firstCar;
    }
  }

  // checking for collision
  if (checkForCollision(...player)) {
    lives--;
    player = [ROWS-1,Math.floor(COLS/2)]
    if (lives <= 0) {
      gameOver = true;
    }
  }
  // check for we win
  if (goals >= GOALNUMBER) {
    haveWon = true;
  }
}
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  for (var r = 0; r < ROWS; r++) {
    for (var c = 0; c < COLS; c++) {
      let x = c * playerSize;
      let y = r * playerSize;
      
      // 1. DRAW ROAD / SIDEWALK
      if (r >= ROWS - sidewalksize || r < topsidewalksize) {
        // sidewalk - light gray
        ctx.fillStyle = "#d0d0d0";
        ctx.fillRect(x, y, playerSize, playerSize);
        // sidewalk crack line
        if (r == ROWS - sidewalksize) {
          ctx.fillStyle = "#999";
          ctx.fillRect(x, y, playerSize, 2);
        }
      } else {
        // road - dark gray
        ctx.fillStyle = "#3a3a3a";
        ctx.fillRect(x, y, playerSize, playerSize);
        
        // road lane line - dashed yellow in middle of row
        if (c % 2 == 0) {
          ctx.fillStyle = "#ffeb3b";
          ctx.fillRect(x + playerSize / 2 - 1, y + playerSize / 2 - 1, 6, 2);
        }
      }
      
      // 2. DRAW CAR
      if (!grid[r][c]) continue;
      let pad = gap;
      ctx.fillStyle = dirs[r] == 1 ? "#ff5252" : "#4caf50"; // red right, green left
      // car is a bit smaller than cell, with headlights
      ctx.fillRect(x + pad, y + pad, playerSize - pad * 2, playerSize - pad * 2);
      
      // headlight
      ctx.fillStyle = "white";
      if (dirs[r] == 1) {
        ctx.fillRect(x + playerSize - pad - 3, y + 4, 2, 2);
        ctx.fillRect(x + playerSize - pad - 3, y + playerSize - 6, 2, 2);
      } else {
        ctx.fillRect(x + pad + 1, y + 4, 2, 2);
        ctx.fillRect(x + pad + 1, y + playerSize - 6, 2, 2);
      }
    }
  }
  
  // player
  let [pr, pc] = player;
  ctx.fillStyle = playerColor;
  ctx.fillRect(pc * playerSize + 3, pr * playerSize + 3, playerSize - 6, playerSize - 6);
  // player outline so you see him on road
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeRect(pc * playerSize + 3, pr * playerSize + 3, playerSize - 6, playerSize - 6);
  
  // the score 
  ctx.font = "15px Arial";
  ctx.fillStyle = "black";
  ctx.fillText(`${goals} / ${GOALNUMBER}`,20, 40);
  
  // the lives
  let curLives = "♥️".repeat(lives);
  ctx.font = "15px Arial";
  ctx.fillStyle = "black";
  ctx.fillText(`${curLives}`,canvas.width/2+50, 130);
  
  if (haveWon) {
    ctx.font = "bold 25px Arial";
    ctx.fillStyle = "yellow";
    ctx.fillText("You won!", canvas.width/2 - 50, canvas.height/2);
  }
  if (gameOver) {
    ctx.font = "bold 25px Arial";
    ctx.fillStyle = "red";
    ctx.fillText("Game over :(", canvas.width / 2 - 70, canvas.height / 2);
  }
}

function reset() {
  initGrid();
  player = [ROWS-1,Math.floor(COLS/2)]
  gameOver = false;
  haveWon = false;
  goals = 0;
  lives = 5;
}
function checkForCollision (r,c) {
  return grid[r][c] == 1
}
function move(y,x) {
  if (gameOver ||
      player[0]+y > ROWS-1 ||
      player[1]+x > COLS-1 || player[1]+x < 0){
    return
  }
  if (player[0]+y < topsidewalksize){
    player = [ROWS-1,Math.floor(COLS/2)]
    goals++;
    speedInMs = 400 - goals * 20; // gets faster every goal
    return
  }
  //check for collision 
  let newR = player[0]+y;
  let newC = player[1]+x;
  if (grid[newR][newC] == 1) {
    lives--;
    player = [ROWS-1,Math.floor(COLS/2)]
    if (lives <= 0) gameOver = true;
    return;
  }

  player = [newR, newC];
}

// touch controls
let startX = 0;
let startY = 0;
canvas.addEventListener("touchstart", (event) => {
  startX = event.touches[0].clientX;
  startY = event.touches[0].clientY;
})

canvas.addEventListener("touchend",(event) =>{
let endX = event.changedTouches[0].clientX;
let endY = event.changedTouches[0].clientY;


  let diffY = endY - startY
  let diffX = endX - startX
  
  if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30) {return}
  //horizontal 
  if (Math.abs(diffX) > Math.abs(diffY)) {
    if (diffX > 0) {
      move(0,1);
    } else {
      move(0,-1);
    }
  }
  // vertical 
  else {
    if (diffY > 0) {
      move(1,0);
    }else {
      move(-1,0);
  }
}
})
canvas.addEventListener("click",()=> {
  if (gameOver || haveWon) {
    reset()
    return
  }
  move(-1,0)
  
})

window.addEventListener("keydown", e => {
  if(e.key=="ArrowUp") move(-1,0)
  if(e.key=="ArrowDown") move(1,0)
  if(e.key=="ArrowLeft") move(0,-1)
  if(e.key=="ArrowRight") move(0,1)
})
