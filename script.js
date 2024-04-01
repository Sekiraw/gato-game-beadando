const canvas = document.getElementById('vaszon');
const ctx = canvas.getContext('2d');
const resetButton = document.getElementById('resetButton');
const pointsElem = document.getElementById('points');
let points = 0;

function displayTopScores() {
    var scores = getStoredScores();
    scores.sort((a, b) => b.points - a.points);
    var topScores = scores.slice(0, 15);
    var scoreboardDiv = document.getElementById('scoreList');
    scoreboardDiv.innerHTML = '';
    topScores.forEach(function (score, index) {
        var listItem = document.createElement('li');
        listItem.textContent = (index + 1) + '. ' + score.playerName + ' - ' + score.points;
        scoreboardDiv.appendChild(listItem);
    });
}

function getStoredScores() {
    var storedScores = localStorage.getItem('scores');
    var scores = storedScores ? JSON.parse(storedScores) : [];
    return scores;
}

displayTopScores();

const gameMusic = document.getElementById('gameMusic');
let musicPlaying = false;

const blockSize = 40;
const rowItemsMaxLength = 15;
const maxCols = 10;
const blockColors = ['red', 'blue', 'green', 'yellow', 'orange'];
const gatoStartY = 360;

let timeMax = 10
let timeLeft = timeMax;
const timerDisplay = document.getElementById('timer');

let gameOver = false;

let columns = [];

for (let i = 0; i < maxCols; i++) {
    let col = [];
    columns[i] = [];
    for (let j = 0; j < rowItemsMaxLength; j++) {
        columns[i][j] = null
    }
    columns[i][0] = blockColors[Math.floor(Math.random() * blockColors.length)];
}

let highlightedColumn = -1;

let blockInHand = null;
let countInHand = 0;
let multipleInHand = false;

function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, blockSize, blockSize);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(x, y, blockSize, blockSize);
}

function drawHighlight(x, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, 0, blockSize, canvas.height);
    if (blockInHand != null) {
        ctx.fillStyle = blockInHand;
        ctx.fillRect(x, gatoStartY, blockSize, blockSize);

        if (multipleInHand) {
            ctx.fillStyle = 'black';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const textX = x + blockSize / 2;
            const textY = gatoStartY + blockSize / 2;

            ctx.fillText(countInHand, textX, textY);
        }
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function update() {
    if (!gameOver) {
        clearCanvas();
        columns.forEach((col, colIndex) => {
            col.forEach((block, blockIndex) => {
                if (block != null) drawBlock(colIndex * blockSize, blockIndex * blockSize, block);
            });
        });
        drawGato();
        if (highlightedColumn !== -1) {
            drawHighlight(highlightedColumn * blockSize, 'rgba(255, 255, 0, 0.5)');
        }
    }
    if (gameOver) {
        drawGameOver();
    }
}

function checkLose() {
    columns.forEach((col) => {
        let notNullCount = 0;
        col.forEach((block) => {
            if (block != null) notNullCount++;
        });
        if (notNullCount > 9) {
            gameOver = true;
        }
    });
}

function drawGameOver() {
    ctx.fillStyle = 'red';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
}

const gatoImg = new Image();
gatoImg.src = 'gato_small.png';
let gatoMouseX = 0;
let doFlip = false;
let rotationAngle = 0;
const rotationSpeed = Math.PI / 90;

function drawGato() {
    ctx.clearRect(0, gatoStartY, canvas.width, canvas.height);

    if (doFlip) {
        rotationAngle += rotationSpeed;
        if (rotationAngle >= Math.PI * 2) {
            rotationAngle = 0;
            doFlip = false;
        }
    }

    ctx.save();
    ctx.translate(gatoMouseX, gatoStartY);
    ctx.rotate(rotationAngle);
    ctx.drawImage(gatoImg, -gatoImg.width / 2, 0);
    ctx.restore();
}

function generateRow() {
    columns.forEach((col, colIndex) => {
        col = moveElementsRight(col);
        col[0] = blockColors[Math.floor(Math.random() * blockColors.length)];
    });
    checkFourOrMoreConnected();
    clearGapsInColumns();
    checkLose();
}

function moveElementsRight(array) {
    for (let i = array.length - 1; i > 0; i--) {
        if (array[i - 1] !== null) {
            array[i] = array[i - 1];
            array[i - 1] = null;
        }
    }
    return array;
}

document.addEventListener('keydown', function (event) {
    if (event.key === '1') {
        generateRow();
    }
});

canvas.addEventListener('mousemove', function (event) {
    if (!gameOver) {
        gatoMouseX = event.clientX - canvas.getBoundingClientRect().left;
        const mouseX = event.clientX - canvas.offsetLeft;
        highlightedColumn = Math.floor(mouseX / blockSize);
    }
});

resetButton.addEventListener('click', function () {
    gameOver = false;
    timeLeft = timeMax;
    timerDisplay.textContent = timeMax;
    countdown();

    blockInHand = null;
    countInHand = 0;
    multipleInHand = false;

    points = 0;

    columns = [];

    for (let i = 0; i < rowItemsMaxLength; i++) {
        let col = [];
        columns[i] = [];
        for (let j = 0; j < rowItemsMaxLength; j++) {
            columns[i][j] = null
        }
        columns[i][0] = blockColors[Math.floor(Math.random() * blockColors.length)];
    }
});

canvas.addEventListener('click', function (event) {
    if (!gameOver) {
        if (highlightedColumn !== -1 && columns[highlightedColumn].length > 0) {
            if (blockInHand == null) {
                // pick
                const lastNotNullIndex = getLastNonNullIndex(columns[highlightedColumn]);

                if (lastNotNullIndex - 1 > -1) {
                    if (columns[highlightedColumn][lastNotNullIndex] == columns[highlightedColumn][lastNotNullIndex - 1]) {
                        blockInHand = columns[highlightedColumn][lastNotNullIndex];

                        columns[highlightedColumn][lastNotNullIndex] = null;
                        columns[highlightedColumn][lastNotNullIndex - 1] = null;
                        multipleInHand = true;
                        countInHand = 2;

                        if (lastNotNullIndex - 2 > -1) {
                            if (blockInHand == columns[highlightedColumn][lastNotNullIndex - 2]) {
                                countInHand = 3;
                                columns[highlightedColumn][lastNotNullIndex - 2] = null;
                            }
                        }

                        checkFourOrMoreConnected();

                        clearGapsInColumns();
                        return;
                    }
                }

                blockInHand = columns[highlightedColumn][lastNotNullIndex];
                columns[highlightedColumn][lastNotNullIndex] = null;

                checkFourOrMoreConnected();

                clearGapsInColumns();
            } else {
                // put
                const firstNullIndex = getFirstNullElementIndex(columns[highlightedColumn]);

                if (!multipleInHand) {
                    columns[highlightedColumn][firstNullIndex] = blockInHand;
                } else {
                    for (let i = 0; i < countInHand; i++) {
                        columns[highlightedColumn][firstNullIndex + i] = blockInHand;
                    }
                }
                blockInHand = null;
                multipleInHand = false;
                countInHand = 0;

                checkFourOrMoreConnected();

                clearGapsInColumns();

                shiftedCol = moveElementsRight(columns[highlightedColumn]);
                shiftedCol[0] = blockColors[Math.floor(Math.random() * blockColors.length)];

                columns[highlightedColumn] = shiftedCol;
            }
        }
    }
    checkLose();
});

function clearGapsInColumns() {
    for (let col = 0; col < columns.length; col++) {
        let gapIndices = [];
        for (let row = 0; row < columns[col].length; row++) {
            if (columns[col][row] === null) {
                gapIndices.push(row);
            } else if (gapIndices.length > 0) {
                const block = columns[col][row];
                columns[col][row] = null;
                const gapIndex = gapIndices.shift();
                columns[col][gapIndex] = block;
                gapIndices.push(row);
            }
        }
    }
}

function getLastNonNullIndex(arr) {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i] !== null) {
            return i;
        }
    }
    return null;
}

function getFirstNullElementIndex(arr) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === null) {
            return i;
        }
    }
    return -1;
}

function diffGame() {
    if (points >= 3000) timeMax = 8;
    else if (points >= 5000) timeMax = 7;
    else if (points >= 10000) timeMax = 6;
}

function checkFourOrMoreConnected() {
    for (let col = 0; col < columns.length; col++) {
        for (let row = 0; row < columns[col].length; row++) {
            if (columns[col][row] !== null) {
                let countHorizontal = 1;
                for (let i = 1; col + i < columns.length && columns[col + i][row] === columns[col][row]; i++) {
                    countHorizontal++;
                }
                let countVertical = 1;
                for (let i = 1; row + i < columns[col].length && columns[col][row + i] === columns[col][row]; i++) {
                    countVertical++;
                }
                let countDiagonal1 = 1;
                for (let i = 1; col + i < columns.length && row + i < columns[col].length && columns[col + i][row + i] === columns[col][row]; i++) {
                    countDiagonal1++;
                }
                let countDiagonal2 = 1;
                for (let i = 1; col + i < columns.length && row - i >= 0 && columns[col + i][row - i] === columns[col][row]; i++) {
                    countDiagonal2++;
                }
                if (countHorizontal == 4 || countVertical == 4 || countDiagonal1 == 4 || countDiagonal2 == 4) {
                    showMessage("400");
                    points += 400;
                    pointsElem.textContent = points;
                    diffGame();

                    for (let i = 0; i < countHorizontal; i++) {
                        columns[col + i][row] = null;
                    }
                    for (let i = 0; i < countVertical; i++) {
                        columns[col][row + i] = null;
                    }
                    for (let i = 0; i < countDiagonal1; i++) {
                        columns[col + i][row + i] = null;
                    }
                    for (let i = 0; i < countDiagonal2; i++) {
                        columns[col + i][row - i] = null;
                    }
                }
                else if (countHorizontal == 5 || countVertical == 5 || countDiagonal1 == 5 || countDiagonal2 == 5) {
                    showMessage("500");
                    points += 500;
                    pointsElem.textContent = points;
                    doFlip = true;
                    diffGame();

                    for (let i = 0; i < countHorizontal; i++) {
                        columns[col + i][row] = null;
                    }
                    for (let i = 0; i < countVertical; i++) {
                        columns[col][row + i] = null;
                    }
                    for (let i = 0; i < countDiagonal1; i++) {
                        columns[col + i][row + i] = null;
                    }
                    for (let i = 0; i < countDiagonal2; i++) {
                        columns[col + i][row - i] = null;
                    }
                }
                else if (countHorizontal == 6 || countVertical == 6 || countDiagonal1 == 6 || countDiagonal2 == 6) {
                    showMessage("600");
                    points += 600;
                    pointsElem.textContent = points;
                    doFlip = true;
                    diffGame();

                    for (let i = 0; i < countHorizontal; i++) {
                        columns[col + i][row] = null;
                    }
                    for (let i = 0; i < countVertical; i++) {
                        columns[col][row + i] = null;
                    }
                    for (let i = 0; i < countDiagonal1; i++) {
                        columns[col + i][row + i] = null;
                    }
                    for (let i = 0; i < countDiagonal2; i++) {
                        columns[col + i][row - i] = null;
                    }
                }
            }
        }
    }
}

function showMessage(message) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';

    setTimeout(function () {
        messageDiv.style.display = 'none';
    }, 3000);
}

function countdown() {
    if (!gameOver) {
        timerDisplay.textContent = timeLeft;
        if (timeLeft > 0) {
            timeLeft -= 1;
            setTimeout(countdown, 1000);
        } else {
            generateRow();
            timeLeft = timeMax;
            timerDisplay.textContent = timeMax;
            setTimeout(countdown, 1000);
        }
    }
}

countdown();

setInterval(update, 1000 / 60);

const playButton = document.getElementById('playButton');
playButton.addEventListener('click', () => {
    if (!musicPlaying) {
        musicPlaying = true;
        gameMusic.play();
    } else {
        musicPlaying = false;
        gameMusic.pause();
    }
});

document.getElementById('submitScore').addEventListener('click', function () {
    var playerName = document.getElementById('playerName').value;

    if (gameOver) {
        if (playerName.trim() !== '') {
            var scores = JSON.parse(localStorage.getItem('scores')) || [];

            scores.push({ playerName: playerName, points: points });

            localStorage.setItem('scores', JSON.stringify(scores));

            document.getElementById('playerName').value = '';

            alert('Score submitted successfully!');
            displayTopScores();
        } else {
            alert('Please enter a valid player name!');
        }
    } else {
        alert('The game is still going!');
    }
});