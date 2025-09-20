initHighScore();

let lastTime = 0; // Track the last frame time

const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

let score = 0;
let timer = 0;

let objects = [];
let objectSpeed = 2; // Start speed of objects

const maxLineLength = 100; // Max length for line in px
let lineCount = 5; // Number of lines to draw
let isDrawing = false;
let lines = [];

const playerSize = 60 // Size of square
let playerX = canvas.width / 2; // Start position by x
const playerY = canvas.height - playerSize - 10; // Start position by Y
const playerSpeed = 3; // Speed of player
let playerDirection = 1; // 1 = right, 2 = left
const maxHealth = 3; // Max health of player
let playerHealth = maxHealth; // Start health of player

const barWidth = 150;
const barHeight = 25;

// Restart button
const restartButton = document.getElementById('restartButton');

document.getElementById('lineCount').textContent = lineCount;
document.getElementById('score').textContent = score;
document.getElementById('time').textContent= timer;
document.getElementById('health').textContent = playerHealth;

let gameOver = false;

let starOffset = 0;
let bigStarSpeed = 0.5;
let smallStarSpeed = 0.25;

let bigStarOffset = 0;
let smallStarOffset = 0;
const starSpeed = 0.5;

const rotation = Math.random() * 360; // Random started angle
const rotationSpeed = Math.random() * 2 - 1; // Speed rotation from -1 to 1

const gameMusic = new Audio('./assets/sounds/game.mp3');
const restartSound = new Audio('./assets/sounds/restart.wav');
const healSound = new Audio('./assets/sounds/heal.wav');
const freezeSound = new Audio('./assets/sounds/freeze.mp3');

gameMusic.loop = true; // music loop
gameMusic.volume = 1; // volume of music
restartSound.volume = 0.5;
healSound.volume = 0.5;
freezeSound.volume = 0.5;

let isPaused = false; // Flag to pause game
let isGameRunning = false; // Flag to check if game is running or not
let objectGenerationInterval = null; // Interval to generate objects

const assets = {
    asteroid: new Image(),
    background: new Image(),
    bigStars: new Image(),
    bonusLife: new Image(),
    emptyHeart: new Image(),
    freezeTime: new Image(),
    heart: new Image(),
    smallStars: new Image(),
    spaceship: new Image(),
    line: new Image(),
};

// Path to images
assets.asteroid.src = './assets/images/asteroid.png';
assets.background.src = './assets/images/background.png';
assets.bigStars.src = './assets/images/big_stars.png';
assets.bonusLife.src = './assets/images/bonus_life.png';
assets.emptyHeart.src = './assets/images/empty_heart.png';
assets.freezeTime.src = './assets/images/freeze_time.png';
assets.heart.src = './assets/images/heart.png';
assets.smallStars.src = './assets/images/small_stars.png';
assets.spaceship.src = './assets/images/SpaceShip.png';
assets.line.src = './assets/images/line.png';



// Events to draw lines by mouse click
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', drawLine);
canvas.addEventListener('mouseup', endDrawing);

restartButton.addEventListener('click', restartGame);

// Event to pause game
window.addEventListener('blur', pauseGame);
// Event to pause game when window is not focused
window.addEventListener('focus', resumeGame);

function resizeCanvas() {
    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.8;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function resizeCanvasWithAspectRatio() {
    const aspectRatio = 4 / 3; // Example aspect ratio (4:3)
    const maxWidth = 800; // Maximum width for desktop
    const maxHeight = 600; // Maximum height for desktop

    let width = window.innerWidth * 0.9;
    let height = width / aspectRatio;

    if (width > maxWidth) {
        width = maxWidth;
        height = maxWidth / aspectRatio;
    }

    if (height > maxHeight) {
        height = maxHeight;
        width = maxHeight * aspectRatio;
    }

    canvas.width = width;
    canvas.height = height;
}
window.addEventListener("resize", resizeCanvasWithAspectRatio);
resizeCanvasWithAspectRatio();

function getTouchPos(canvas, touchEvent) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: touchEvent.touches[0].clientX - rect.left,
        y: touchEvent.touches[0].clientY - rect.top
    };
}

// Add touch event support for mobile devices
canvas.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];
    const touchPos = { x: touch.clientX, y: touch.clientY };
    startDrawing({ offsetX: touchPos.x, offsetY: touchPos.y });
});

canvas.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];
    const touchPos = { x: touch.clientX, y: touch.clientY };
    drawLine({ offsetX: touchPos.x, offsetY: touchPos.y });
});

canvas.addEventListener('touchend', endDrawing);


// Start drawing a line when mouse is clicked
function startDrawing(event) {
    if (lineCount > 0) {
        isDrawing = true;
        const x = event.offsetX;
        const y = event.offsetY;
        lines.push({ startX: x, startY: y, endX: x, endY: y, timer: 500 });
        lineCount--; // Decrease line count by 1 after create
        document.getElementById('lineCount').textContent = lineCount;
    }
}

function pointToLineDistance(x,y,x1,y1,x2,y2) {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    const param = lenSq !== 0 ? dot / lenSq : -1;

    let xx,yy;

    if (param < 0) {
        xx=x1;
        yy=y1;
    } else if (param > 1) {
        xx=x2;
        yy=y2;
    } else {
        xx=x1+param*C;
        yy=y1+param*D;
    }
    
    const dx = x - xx;
    const dy = y - yy;

    return Math.sqrt(dx * dx + dy * dy);
}

// Update line (decrease timer)
function updateLines(deltaTime) {
    for (let i=lines.length-1; i>=0; i--) {
        const line = lines[i];
        line.timer -= deltaTime * 125;

        // Delete the line if timer is 0
        if (line.timer <= 0) {
            lines.splice(i, 1);
            lineCount++;
            document.getElementById('lineCount').textContent = lineCount;
        }
    }
}

// Draw line
function drawLine(event) {
    if (!isDrawing || gameOver) return;

    const line = lines[lines.length - 1];
    line.endX = event.offsetX;
    line.endY = event.offsetY;

    // Check the length of line 
    const dx = line.endX - line.startX;
    const dy = line.endY - line.startY;
    const length = Math.sqrt(dx*dx+dy*dy);

    // If length of line more than max, make a limit
    if (length>maxLineLength) {
        const angle=Math.atan2(dy,dx); // Angle of line
        line.endX = line.startX + maxLineLength * Math.cos(angle);
        line.endY = line.startY + maxLineLength * Math.sin(angle);
    }

}

// Finish drawing a line when mouse is released
function endDrawing() {
    if (isDrawing) {
        isDrawing = false;
    }
}

// Generate objects that will fall
function createFallingObject() {

    if (gameOver) return; // Stop generate objects if game is over

    const x = Math.random() * canvas.width;
    const types = ['red', 'green', 'yellow'];
    
    // Changing random
    const random = Math.random(); // Random number between 0 and 1
    let type;
    if (random < 0.85) {
        type = 'red'; // 85 %
        } 
    else if (random < 0.95) {
        type = 'yellow'; // 10%
    }
    else {
        type = 'green'; // 5%
    }
    objects.push({ 
        x, 
        y: 0, 
        type, 
        size: 40,
        rotation: Math.random()*360, 
        rotationSpeed: Math.random()*2-1,
     });
}

// Function to saving high score
function updateHighScore() {
    const highScore = parseInt(localStorage.getItem('highScore')) || 0;

    if (score > highScore) {
        localStorage.setItem('highScore', score);
        document.getElementById('highScore').textContent =score;
    } else {
        document.getElementById('highScore').textContent = highScore;
    }
}

// Function to initialise high score
function initHighScore() {
    const highScore = localStorage.getItem('highScore') || 0;
    document.getElementById('highScore').textContent = highScore;
}



// Game update function
function gameLoop(timestamp) {

    if (!gameOver && !isPaused) {
        isGameRunning = true;
    const deltaTime = (timestamp - lastTime) / 1000; // Convert to seconds
    lastTime = timestamp;

    isGameRunning = true;
        if (gameMusic.paused) {
            gameMusic.play();
        }
    updateLines(deltaTime); // Decrease timer lines
    updateObjects(deltaTime);
    drawGame();
    requestAnimationFrame(gameLoop);
    } 
    else {
        isGameRunning = false;
    }
    // Increase game speed
    if (score % 15 === 0 && score > 0) {
        objectSpeed += 0.01;
    }
}



// Update position and rendering
function updateObjects(deltaTime) {
    for (let i = objects.length - 1; i >= 0; i--) {
        const object = objects[i];
        object.y += objectSpeed * deltaTime * 60; // Update object position

        // Update angle of rotation
        if (object.type === 'red') {
            object.rotation = (object.rotation + object.rotationSpeed) % 360;
        }

        // Check collision objects and lines
        if (checkCollision(object)) {
            objects.splice(i, 1);
            if (object.type === 'red') {
            score++;
            document.getElementById('score').textContent = score;
            updateHighScore();
            }
            continue;
        }

        // Check collision objects with player
        if (checkCollision(object) || checkCollisionWithPlayer(object)) {
            objects.splice(i, 1);
            continue;
        }
                
        // Delete object if it goes off the screen
        if (object.y > canvas.height) {
            objects.splice(i, 1);
        }
    }

    if (!isPaused) {
    // Update player's position
    playerX += playerSpeed * playerDirection * deltaTime * 60;

    // Check borders and change direction
    if (playerX + playerSize >= canvas.width || playerX <= 0) {
        playerDirection *= -1; // Change direction
    }
}
}

// Check collision objects and lines
function checkCollision(object) {
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        const { startX, startY, endX, endY } = line;

        const distance = pointToLineDistance(object.x, object.y, startX, startY, endX, endY);

        if (distance <= object.size * 0.75) {
            if (object.type === 'green') {
                if (playerHealth < maxHealth) {
                    playerHealth++;
                    document.getElementById('health').textContent = playerHealth;
                    healSound.currentTime = 0;
                    healSound.play();    
                }
                } else if (object.type === 'yellow') {
                    objectSpeed = Math.max(1, objectSpeed - 1);  // freezing time
                    freezeSound.currentTime = 0;
                    freezeSound.play();
                    setTimeout(() => {
                    objectSpeed += 1; // unfreezing after 5 seconds
                }, 5000);
            }

            lines.splice(i, 1) // Delete line if collision
            lineCount++; // Return opportunity to draw a new line
            document.getElementById('lineCount').textContent=lineCount;
            return true;
        }
    }
    return false;
}

function checkCollisionWithPlayer(object) {
    const dx = object.x - (playerX + playerSize / 2);
    const dy = object.y - (playerY + playerSize / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < object.size / 2 + playerSize / 2) {
            if (object.type === 'red') 
                {
                playerHealth = Math.max(0, playerHealth - 1); // Decrease health
                document.getElementById('health').textContent = playerHealth;
                if (playerHealth <= 0) 
                    {
                    gameOver = true;
                    gameMusic.pause(); // pause music
                    gameMusic.currentTime = 0; // reset music
                    restartButton.style.display = 'block' // Show restart button
                    }
                else if (object.type === 'green' && playerHealth < maxHealth) {
                        playerHealth++;
                        document.getElementById('health').textContent = playerHealth;
                        healSound.currentTime = 0;
                        healSound.play();
                } 
                } else if (object.type === 'yellow') {
                objectSpeed=Math.max(1,objectSpeed-1); // Freeze time for falling object
                freezeSound.currentTime = 0;
                freezeSound.play();
                setTimeout(() => objectSpeed++ , 5000);
                }
            return true;
        }
    return false;
}

function drawHealthBar() {
    const heartSize=30;
    for (let i=0; i<maxHealth; i++) {
        const x = 10 + i * (heartSize + 5);
        if (i < playerHealth) {
            context.drawImage(assets.heart, x, 10, heartSize, heartSize);
        }
        else {
            context.drawImage(assets.emptyHeart,x,10,heartSize,heartSize);
        }
    }
}

// Rendering game process
function drawGame() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background and stars
    context.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
    
    context.drawImage(assets.bigStars, 0, bigStarOffset, canvas.width, canvas.height);
    context.drawImage(assets.bigStars, 0, bigStarOffset - canvas.height, canvas.width, canvas.height);

    context.drawImage(assets.smallStars, 0, smallStarOffset, canvas.width, canvas.height);
    context.drawImage(assets.smallStars, 0, smallStarOffset - canvas.height, canvas.width, canvas.height);
    
    bigStarOffset = (bigStarOffset + starSpeed) % canvas.height;
    smallStarOffset = (smallStarOffset + starSpeed * 0.5) % canvas.height;
    
    // Rendering objects
    for (let object of objects) {
        if (object.x <0) object.x = 0;
        if (object.x > canvas.width-40) object.x = canvas.width - 40;
        if (object.type === 'red') {
            context.save(); // Save transformation
            context.translate(object.x + 20, object.y + 20); // Change pivot point
            context.rotate((object.rotation * Math.PI) / 180); // Rotate object
            context.drawImage(assets.asteroid, -20, -20, 40, 40);
            context.restore(); // Restore transformation
        }
        else if (object.type === 'green') {
            context.drawImage(assets.bonusLife,object.x,object.y,40,40);
        }
        else if (object.type === 'yellow') {
            context.drawImage(assets.freezeTime,object.x,object.y,40,40);
        }
    }

    // Rendering lines
    context.strokeStyle = 'cyan';
    context.lineWidth = 2;
    for (let line of lines) {
        const { startX, startY, endX, endY } = line;
        const dx = endX - startX;
        const dy = endY - startY;
        const angle = Math.atan2(dy, dx); // angle in radians
        const length = Math.sqrt(dx * dx + dy * dy); // length of line
    
        context.save();
        context.translate(startX, startY); // moving starting point to origin
        context.rotate(angle); // rotate line
        context.drawImage(assets.line, 0, -5, length, 10); // draw line
        context.restore();
    }

    // Rendering player
    context.drawImage(assets.spaceship,playerX,playerY,playerSize,playerSize);

    // Rendering health bar     
    drawHealthBar();
    startObjectGeneration();
}

function restartGame() {
    restartSound.currentTime = 0; // reset time
    restartSound.play();
    
    // Reset game state
    score = 0;
    timer =0;
    objects=[];
    objectSpeed = 2;
    lineCount = 5;
    playerHealth = maxHealth;
    gameOver = false;
    isPaused = false;
    lastTime = 0;

    // Reset player position
    playerX= canvas.width/2;
    playerDirection = 1;


    // Update elements
    document.getElementById('lineCount').textContent = lineCount;
    document.getElementById('score').textContent = score;
    document.getElementById('time').textContent = timer;
    document.getElementById('health').textContent = playerHealth;

    // Hide reset button
    restartButton.style.display = 'none';
    
    // Restart music
    gameMusic.currentTime = 0;
    gameMusic.play();

    requestAnimationFrame((timestamp) => {
        lastTime = timestamp;
        gameLoop(timestamp);
    });
    stopObjectGeneration();
    startObjectGeneration();
}

// Function for pause game
function pauseGame() {
    if (!gameOver) {
        isPaused = true;
        gameMusic.pause(); // Stop music
        healSound.pause();
        freezeSound.pause();
        stopObjectGeneration(); // Stop object generation
    }
}

// Function for resume game
function resumeGame() {
    if (!gameOver && !isGameRunning) {
        isPaused = false;
        gameMusic.play(); // resume music
        requestAnimationFrame((timestamp) => {
            lastTime = timestamp;
            gameLoop(timestamp); 
        });
    }
    startObjectGeneration(); // resume object generation
}

// Event for change visible web
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pauseGame();
    } else {
        resumeGame();
    }
});

function startObjectGeneration() {
    if (!objectGenerationInterval) {
        objectGenerationInterval = setInterval(() => {
            if (!isPaused && !gameOver) createFallingObject(); 
        }, 1000); // Generation interval
    }
}

function stopObjectGeneration() {
    if (objectGenerationInterval) {
        clearInterval(objectGenerationInterval); // Stop timer
        objectGenerationInterval = null; // Reset
    }
}

startObjectGeneration();
requestAnimationFrame(gameLoop);