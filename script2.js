document.addEventListener('DOMContentLoaded', () => {
    const ball = document.getElementById('ball');
    const playerPaddle = document.getElementById('player-paddle');
    const computerPaddle = document.getElementById('computer-paddle');
    const gameContainer = document.querySelector('.game-container');
    const container = document.querySelector('.container');
    const scoreDisplay = document.getElementById('score');
    const messageDisplay = document.getElementById('message');
    const currencyDisplay = document.getElementById('currency');
    let playerScore = 0;
    let computerScore = 0;
    const winningScore = 3;
    let playerCurrency = 5;
    const entryFee = 1;
    const winReward = 1;
    let ballSpeedX = 4;
    let ballSpeedY = 4;
    let ballX = gameContainer.clientWidth / 2 - ball.offsetWidth / 2;
    let ballY = gameContainer.clientHeight / 2 - ball.offsetHeight / 2;
    let playerPaddleX = gameContainer.clientWidth / 2 - playerPaddle.offsetWidth / 2;
    let computerPaddleX = gameContainer.clientWidth / 2 - computerPaddle.offsetWidth / 2;
    let animationFrameId;
    const speedIncrement = 0.6;
    const computerPaddleSpeed = 6;

    function startGame() {
        if (playerCurrency < entryFee) {
            displayMessage("Not enough points for the game!");
            return;
        }

        playerCurrency -= entryFee;
        updateCurrencyDisplay();
        messageDisplay.style.display = 'none';

        playerScore = 0;
        computerScore = 0;
        updateScore();
        resetBall();
        moveBall();
    }

    function resetBall() {
        ballX = gameContainer.clientWidth / 2 - ball.offsetWidth / 2;
        ballY = gameContainer.clientHeight / 2 - ball.offsetHeight / 2;
        ballSpeedX = 4 * (Math.random() > 0.5 ? 1 : -1);
        ballSpeedY = 4 * (Math.random() > 0.5 ? 1 : -1);
        updateBallPosition();
    }

    function moveBall() {
        if (playerScore >= winningScore || computerScore >= winningScore) {
            cancelAnimationFrame(animationFrameId);
            endGame();
            return;
        }

        ballX += ballSpeedX;
        ballY += ballSpeedY;

        // Обмеження для руху м'яча по горизонталі
        if (ballX + ball.offsetWidth > gameContainer.clientWidth) {
            ballX = gameContainer.clientWidth - ball.offsetWidth;
            ballSpeedX = -ballSpeedX;
            glowField();
        } else if (ballX < 0) {
            ballX = 0;
            ballSpeedX = -ballSpeedX;
            glowField();
        }

        // Перевірка зіткнення з ракеткою гравця
        if (ballY + ball.offsetHeight > playerPaddle.offsetTop &&
            ballY + ball.offsetHeight < playerPaddle.offsetTop + playerPaddle.offsetHeight &&
            ballX + ball.offsetWidth > playerPaddle.offsetLeft &&
            ballX < playerPaddle.offsetLeft + playerPaddle.offsetWidth) {
            ballY = playerPaddle.offsetTop - ball.offsetHeight;
            ballSpeedY = -ballSpeedY;
            ballSpeedX += (ballSpeedX > 0 ? speedIncrement : -speedIncrement);
            ballSpeedY += (ballSpeedY > 0 ? speedIncrement : -speedIncrement);
            glowPaddle(playerPaddle);
        }

        // Перевірка зіткнення з ракеткою комп'ютера
        if (ballY < computerPaddle.offsetTop + computerPaddle.offsetHeight &&
            ballY > computerPaddle.offsetTop &&
            ballX + ball.offsetWidth > computerPaddle.offsetLeft &&
            ballX < computerPaddle.offsetLeft + computerPaddle.offsetWidth) {
            ballY = computerPaddle.offsetTop + computerPaddle.offsetHeight;
            ballSpeedY = -ballSpeedY;
            ballSpeedX += (ballSpeedX > 0 ? speedIncrement : -speedIncrement);
            ballSpeedY += (ballSpeedY > 0 ? speedIncrement : -speedIncrement);
            glowPaddle(computerPaddle);
        }

        // Перевірка чи м'яч вийшов за нижню або верхню межу
        if (ballY + ball.offsetHeight > gameContainer.clientHeight) {
            playerScore++;
            updateScore();
            if (playerScore >= winningScore) {
                playerCurrency += winReward;
                displayMessage("You are sybil!");
                updateCurrencyDisplay();
            } else {
                resetBall();
            }
        } else if (ballY < 0) {
            computerScore++;
            updateScore();
            if (computerScore >= winningScore) {
                displayMessage("You are not sybil!");
            } else {
                resetBall();
            }
        }

        ball.style.left = ballX + 'px';
        ball.style.top = ballY + 'px';

        moveComputerPaddle();
        animationFrameId = requestAnimationFrame(moveBall);
    }

    function moveComputerPaddle() {
        const paddleCenter = computerPaddleX + computerPaddle.offsetWidth / 2;
        if (paddleCenter < ballX) {
            computerPaddleX += Math.min(computerPaddleSpeed, ballX - paddleCenter);
        } else if (paddleCenter > ballX) {
            computerPaddleX -= Math.min(computerPaddleSpeed, paddleCenter - ballX);
        }
        computerPaddleX = Math.max(0, Math.min(gameContainer.clientWidth - computerPaddle.offsetWidth, computerPaddleX));
        computerPaddle.style.left = computerPaddleX + 'px';
    }

    function movePlayerPaddle(event) {
        let clientX;
        if (event.type === 'mousemove') {
            clientX = event.clientX;
        } else if (event.type === 'touchmove') {
            clientX = event.touches[0].clientX;
        }

        playerPaddleX = clientX - gameContainer.offsetLeft - playerPaddle.offsetWidth / 2;
        playerPaddleX = Math.max(0, Math.min(gameContainer.clientWidth - playerPaddle.offsetWidth, playerPaddleX));
        playerPaddle.style.left = playerPaddleX + 'px';
    }

    function updateScore() {
        scoreDisplay.textContent = `${playerScore} : ${computerScore}`;
    }

    function glowPaddle(paddle) {
        paddle.classList.add('glow');
        setTimeout(() => {
            paddle.classList.remove('glow');
        }, 200);
    }

    function glowField() {
        gameContainer.classList.add('glow');
        ball.classList.add('glow');
        setTimeout(() => {
            gameContainer.classList.remove('glow');
            ball.classList.remove('glow');
        }, 200);
    }

    function updateBallPosition() {
        ball.style.left = ballX + 'px';
        ball.style.top = ballY + 'px';
    }

    function displayMessage(message) {
        messageDisplay.textContent = message;
        messageDisplay.style.display = 'block';
    }

    function updateCurrencyDisplay() {
        currencyDisplay.textContent = `Очки: ${playerCurrency}`;
    }

    function endGame() {
        setTimeout(() => {
            messageDisplay.style.display = 'none';
            startGame();
        }, 3000);
    }

    container.addEventListener('mousemove', movePlayerPaddle);
    container.addEventListener('touchmove', movePlayerPaddle);
    startGame();
});
