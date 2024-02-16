document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('pong');
    const ctx = canvas.getContext('2d');

    let ballPosX = canvas.width / 2;
    let ballPosY = canvas.height / 2;
    let player1_name = 'Player 1';
    let player2_name = 'Player 2';
    let ballSpeedX = 5;
    let ballSpeedY = 5;
    let paddleSpeed = 15;
    let paddleHeight = 100;
    let paddleWidth = 10;
    let leftPaddleY = (canvas.height - paddleHeight) / 2;
    let rightPaddleY = (canvas.height - paddleHeight) / 2;
    let player1Score = 0;
    let player2Score = 0;
    let scoreMessage = '';
    let winningScore = 5;
    let messageDisplayCounter = 0;
    let animationFrameId;
    
    let ballspeed_save = 5;

    const homepage = document.getElementById('homepage');
    const play = document.getElementById('play');
    const tournament = document.getElementById('tournament');
    const goToPlayPageButton = document.getElementById('PLAY');
    const goTotournamentPageButton = document.getElementById('TOURNAMENT');
    const settingsButton = document.getElementById('settings');
    const goToSettingsPageButton = document.getElementById('SETTINGS');
    const goToHomepageButton = document.getElementById('navHome');

    const goToSaveButton = document.getElementById('save');
    const goToPreviousButton = document.getElementById('previous');

    function resetVars()
    {
        ballPosX = canvas.width / 2;
        ballPosY = canvas.height / 2;
        player1_name = 'Player 1';
        player2_name = 'Player 2';
        ballSpeedX = ballspeed_save;
        ballSpeedY = ballspeed_save;
        paddleSpeed = 15;
        paddleHeight = 100;
        paddleWidth = 10;
        leftPaddleY = (canvas.height - paddleHeight) / 2;
        rightPaddleY = (canvas.height - paddleHeight) / 2;
        player1Score = 0;
        player2Score = 0;
        scoreMessage = '';
        winningScore = 5;
        messageDisplayCounter = 0;
    }

    // Function to fetch and populate settings
    function populateSettings() {
        fetch('/api/settings')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch settings');
                }
                return response.json();
            })
            .then(settings => {
                // Populate input fields with fetched settings
                document.getElementById('player1').value = String(settings.player1);
                player1_name = String(settings.player1);
                document.getElementById('player2').value = String(settings.player2);
                player2_name = String(settings.player2);
                document.getElementById('ballSpeed').value = settings.ballSpeed;
                ballspeed_save = settings.ballSpeed;
                document.getElementById('paddleSpeed').value = settings.paddleSpeed;
                paddleSpeed = settings.paddleSpeed * 3;
                document.getElementById('winningScore').value = settings.winningScore;
                winningScore = settings.winningScore;
            })
            .catch(error => {
                // Handle error here
                console.error('Error fetching settings:', error);
            });
    }

    goToHomepageButton.addEventListener('click', function()
    {
        player1Score = 0;
        player2Score = 0;
        populateSettings();
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        if (!play.classList.contains('hidden'))
            play.classList.add('hidden');
        if (!tournament.classList.contains('hidden'))
            tournament.classList.add('hidden');
        if (!settingsButton.classList.contains('hidden'))
            settingsButton.classList.add('hidden');
        homepage.classList.remove('hidden');
    });

    goToPlayPageButton.addEventListener('click', function()
    {
        populateSettings();
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        resetVars();
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
        populateSettings();
    });

    goToSaveButton.addEventListener('click', function()
    {   
        // Get the values from the input fields
        const player1 = document.getElementById('player1').value;
        const player2 = document.getElementById('player2').value;
        const ballSpeed = document.getElementById('ballSpeed').value;
        const paddleSpeed = document.getElementById('paddleSpeed').value;
        const winningScore = document.getElementById('winningScore').value;

        // Construct the data object to send to the backend
        const data = {
            player1: document.getElementById('player1').value,
            player2: document.getElementById('player2').value,
            ballSpeed: parseInt(document.getElementById('ballSpeed').value, 10),
            paddleSpeed: parseInt(document.getElementById('paddleSpeed').value, 10),
            winningScore: parseInt(document.getElementById('winningScore').value, 10)
        };
        console.log(data);

        // Make an AJAX POST request to your backend endpoint
        fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save settings');
            }
            // Handle success response here
            console.log('Settings saved successfully');
            goToHomepageButton.click();
        })
        .catch(error => {
            // Handle error here
            console.error('Error saving settings:', error);
        });
    });

    goToPreviousButton.addEventListener('click', function()
    {
        goToHomepageButton.click();
    });

    function draw_pong()
    {
        if ((player1Score >= winningScore || player2Score >= winningScore) && messageDisplayCounter === 0)
        {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            goToHomepageButton.click();
            player1Score = 0;
            player2Score = 0;
        }
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
                    scoreMessage =  player2_name + ' Scored!';
                }
                else if (ballPosX >= canvas.width)
                {
                    player1Score++;
                    scoreMessage = player1_name + ' Scored!';
                }
                ballPosX = canvas.width / 2;
                ballPosY = canvas.height / 2;
                ballSpeedX = ballspeed_save;
                ballSpeedY = ballspeed_save;
                messageDisplayCounter = 180;
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

        if (player1Score >= winningScore)
        {
            scoreMessage = player1_name + ' Wins!';
        }

        if (player2Score >= winningScore)
        {
            scoreMessage = player2_name + ' Wins!';
        }

        // Display scoring message
        if (messageDisplayCounter > 0)
        {
            ctx.font = '30px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(scoreMessage, canvas.width / 2, canvas.height / 2);
        }
    
        // Always update score display and request next frame
        document.getElementById('player1_score').textContent = player1_name + `: ${player1Score}`;
        document.getElementById('player2_score').textContent = player2_name + `: ${player2Score}`;
        document.getElementById('winning_score').textContent = "Winning score" + `: ${winningScore}`;

        animationFrameId = requestAnimationFrame(draw_pong);
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
