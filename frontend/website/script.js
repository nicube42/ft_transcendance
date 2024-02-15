document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('pong');
    const ctx = canvas.getContext('2d');

    let ballPosX = canvas.width / 2;
    let ballPosY = canvas.height / 2;
    let ballSpeedX = 4;
    let ballSpeedY = 4;
    let paddleHeight = 100;
    let paddleWidth = 10;
    let leftPaddleY = (canvas.height - paddleHeight) / 2;
    let rightPaddleY = (canvas.height - paddleHeight) / 2;
    const paddleSpeed = 16;
    let player1Score = 0;
    let player2Score = 0;
    let scoreMessage = '';
    let messageDisplayCounter = 0;


    const homepage = document.getElementById('homepage');
    const play = document.getElementById('play');
    const tournament = document.getElementById('tournament');
    const goToPlayPageButton = document.getElementById('PLAY');
    const goTotournamentPageButton = document.getElementById('TOURNAMENT');
    const settingsButton = document.getElementById('settings');
    const goToSettingsPageButton = document.getElementById('SETTINGS');

    const goToSaveButton = document.getElementById('save');
    const goToPreviousButton = document.getElementById('previous');

    goToPlayPageButton.addEventListener('click', function()
    {
        homepage.classList.add('hidden');
        play.classList.remove('hidden');
        draw_pong();
    });

    goTotournamentPageButton.addEventListener('click', function()
    {
        homepage.classList.add('hidden');
        tournament.classList.remove('hidden');
    });

    goToSettingsPageButton.addEventListener('click', function()
    {
        homepage.classList.add('hidden');
        settingsButton.classList.remove('hidden');
    });

    goToSaveButton.addEventListener('click', function()
    {
        settingsButton.classList.add('hidden');
        homepage.classList.remove('hidden');
    });

    goToPreviousButton.addEventListener('click', function()
    {
        tournament.classList.add('hidden');
        settingsButton.classList.add('hidden');
        homepage.classList.remove('hidden');
    });

    function draw_pong()
    {
        if (messageDisplayCounter === 0)
        {

            ballPosX += ballSpeedX;
            ballPosY += ballSpeedY;
        
            if (ballPosY <= 0 || ballPosY >= canvas.height)
            {
                ballSpeedY = -ballSpeedY;
            }

            // Left paddle collision
            if (ballPosX <= paddleWidth)
            {
                if (ballPosY > leftPaddleY && ballPosY < leftPaddleY + paddleHeight)
                {
                    ballSpeedX = -ballSpeedX;
                    let deltaY = ballPosY - (leftPaddleY + paddleHeight / 2);
                    ballSpeedY = deltaY * 0.35;
                }
            }
        
            // Right paddle collision
            if (ballPosX >= canvas.width - paddleWidth)
            {
                if (ballPosY > rightPaddleY && ballPosY < rightPaddleY + paddleHeight)
                {
                    ballSpeedX = -ballSpeedX;
                    let deltaY = ballPosY - (rightPaddleY + paddleHeight / 2);
                    ballSpeedY = deltaY * 0.35;
                }
            }
        
            // Ball reset when out of bounds
            if (ballPosX <= 0 || ballPosX >= canvas.width)
            {
                if (ballPosX <= 0)
                {
                    player2Score++;
                    scoreMessage = 'Player 2 Scored!';
                }
                else if (ballPosX >= canvas.width)
                {
                    player1Score++;
                    scoreMessage = 'Player 1 Scored!';
                }
                ballPosX = canvas.width / 2;
                ballPosY = canvas.height / 2;
                ballSpeedX = -ballSpeedX;
                ballSpeedY = 4;
                messageDisplayCounter = 90;
            }
        }
        else
        {
            messageDisplayCounter--;
        }
    
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        // Draw the ball
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(ballPosX, ballPosY, 10, 0, Math.PI*2, true);
        ctx.fill();
    
        // Draw the paddles
        ctx.fillStyle = 'white';
        ctx.fillRect(0, leftPaddleY, paddleWidth, paddleHeight);
        ctx.fillRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight);
    
        // Display scoring message
        if (messageDisplayCounter > 0)
        {
            ctx.font = '30px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(scoreMessage, canvas.width / 2, canvas.height / 2);
        }
    
        // Always update score display and request next frame
        document.getElementById('player1').textContent = `Player 1: ${player1Score}`;
        document.getElementById('player2').textContent = `Player 2: ${player2Score}`;
    
        requestAnimationFrame(draw_pong);
    }
    // Keyboard controls
    window.addEventListener('keydown', function(e)
    {
        switch(e.key)
        {
            case 'ArrowUp':
                rightPaddleY = Math.max(rightPaddleY - paddleSpeed, 0);
                break;
            case 'ArrowDown':
                rightPaddleY = Math.min(rightPaddleY + paddleSpeed, canvas.height - paddleHeight);
                break;
            case 'w':
                leftPaddleY = Math.max(leftPaddleY - paddleSpeed, 0);
                break;
            case 's':
                leftPaddleY = Math.min(leftPaddleY + paddleSpeed, canvas.height - paddleHeight);
                break;
        }
    });

});
