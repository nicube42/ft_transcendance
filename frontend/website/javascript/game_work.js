const game = {

    gameMode: 'multiplayer',

    settings: {
        player1Name: 'Player 1',
        player2Name: 'Player 2',
        ballSpeed: 5,
        paddleSpeed: 15,
        winningScore: 5,
    },

    updateGameSettings: function(settings) {
        this.ballSpeedX = settings.ballSpeed / 2;
        this.ballSpeedY = settings.ballSpeed / 2;
        this.paddleSpeed = settings.paddleSpeed;
        this.winningScore = settings.winningScore;
        this.player1_name = settings.player1;
        this.player2_name = settings.player2;
    },

    canvas: null,
    playerRole: null,
    ctx: null,
    ballPosX: 0,
    ballPosY: 0,
    ballSpeedX: 5,
    ballSpeedY: 5,
    paddleSpeed: 15,
    paddleHeight: 100,
    paddleWidth: 10,
    leftPaddleY: 0,
    rightPaddleY: 0,
    player1Score: 0,
    player2Score: 0,
    scoreMessage: '',
    winningScore: 5,
    messageDisplayCounter: 180,
    animationFrameId: null,
    ballspeed_save: 5,
    aiPaddleDirection: 1,
    aiActionInterval: null,
    processAIActions: false,
    aiPaddleMovementInterval: null,

    init: function() {
        this.canvas = document.getElementById('pong');
        if (this.canvas.getContext) {
            this.ctx = this.canvas.getContext('2d');
            this.resetVars();
            this.drawPong();
            window.removeEventListener('keydown', this.handleKeyDown.bind(this));
            window.addEventListener('keydown', this.handleKeyDown.bind(this));
        }
    },

    setGameMode: function(mode) {
        this.gameMode = mode;
        console.log('Game mode set to', mode);
        if (mode === 'multiplayer') {
            this.stopControlAndDisconnect();
        }
        else if (mode === 'distant') {
            //this.ensureWebSocketConnection();
        }
    },

    updateGameSettings: function(settings) {
        this.ballSpeedX = settings.ballSpeed / 2;
        this.ballSpeedY = settings.ballSpeed / 2;
        this.paddleSpeed = settings.paddleSpeed;
        this.winningScore = settings.winningScore;
        this.player1_name = settings.player1Name;
        this.player2_name = settings.player2Name;
    },

    resetVars: function() {
        this.ballSpeedX = this.settings.ballSpeed / 2;
        this.ballSpeedY = this.settings.ballSpeed / 2;
        this.paddleSpeed = this.settings.paddleSpeed;
        this.winningScore = this.settings.winningScore;

        this.ballPosX = this.canvas.width / 2;
        this.ballPosY = this.canvas.height / 2;
        this.leftPaddleY = (this.canvas.height - this.paddleHeight) / 2;
        this.rightPaddleY = (this.canvas.height - this.paddleHeight) / 2;
        this.player1Score = 0;
        this.player2Score = 0;
        this.scoreMessage = '';
        this.messageDisplayCounter = 0;
        this.player1_name = this.settings.player1;
        this.player2_name = this.settings.player2;
        this.aiPaddleDirection = 1;
        
    },

    handleKeyDown: function(e) {
        let direction = null;
    
        if (game.gameMode === 'distant') {
            switch(e.key) {
                case 'w':
                    direction = 'up';
                    if (game.playerRole === 'left')
                        game.leftPaddleY = Math.max(game.leftPaddleY - game.paddleSpeed, 0);
                    else
                        game.rightPaddleY = Math.max(game.rightPaddleY - game.paddleSpeed, 0);
                    break; 
                case 's':
                    direction = 'down';
                    if (game.playerRole === 'left')
                        game.leftPaddleY = Math.min(game.leftPaddleY + game.paddleSpeed, game.canvas.height - game.paddleHeight);
                    else
                        game.rightPaddleY = Math.min(game.rightPaddleY + game.paddleSpeed, game.canvas.height - game.paddleHeight);
                    break;
            }
    
            if (direction) {
                gameSocket.sendPaddleMovement(direction);
            }
        }
        else
        {

            switch(e.key) {
                case 'ArrowUp':
                    if (this.gameMode === 'multiplayer')
                        this.rightPaddleY = Math.max(this.rightPaddleY - this.paddleSpeed, 0);
                    break;
                case 'ArrowDown':
                    if (this.gameMode === 'multiplayer')
                        this.rightPaddleY = Math.min(this.rightPaddleY + this.paddleSpeed, this.canvas.height - this.paddleHeight);
                    break;
                case 'w':
                    this.leftPaddleY = Math.max(this.leftPaddleY - this.paddleSpeed, 0);
                    break;
                case 's':
                    this.leftPaddleY = Math.min(this.leftPaddleY + this.paddleSpeed, this.canvas.height - this.paddleHeight);
                    break;
            }
        }
    },

    pause: function() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            console.log('Game paused');
            this.resetVars();
            this.stopControlAndDisconnect();
        }
    },
    
    resume: function() {
        if (!this.animationFrameId) {
            this.resetVars();
            this.drawPong();
            console.log('Game resumed');
            if (this.gameMode === 'singlePlayer')
            {
                this.processAIActions = true;
                this.controlRightPaddleWithAI();
            }
            else
            {
                this.stopControlAndDisconnect();
            }
        }
    },
    
    handleVisibilityChange: function() {
        if (ui.isSectionVisible('play')) {
            this.resume();  
        } else {
            this.pause();
        }
    },

    drawPong: function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.messageDisplayCounter === 0)
        {
            if (this.gameMode === 'distant')
            {
                gameSocket.sendBallState();
            }
            if (this.player1Score >= this.winningScore || this.player2Score >= this.winningScore)
            {
                this.resetVars();
                ui.showOnlyOneSection('endgameStats');
            }

            // Ball movement logic
            this.ballPosX += this.ballSpeedX;
            this.ballPosY += this.ballSpeedY;
            if (this.ballPosY <= 0 || this.ballPosY >= this.canvas.height) {
                this.ballSpeedY = -this.ballSpeedY;
            }

            // Paddle and ball collision logic
            if ((this.ballPosX <= this.paddleWidth && this.ballPosY > this.leftPaddleY && this.ballPosY < this.leftPaddleY + this.paddleHeight) || 
                (this.ballPosX >= this.canvas.width - this.paddleWidth && this.ballPosY > this.rightPaddleY && this.ballPosY < this.rightPaddleY + this.paddleHeight)) {
                this.ballSpeedX = -this.ballSpeedX;
            }

            // Score update logic
            if (this.ballPosX <= 0 || this.ballPosX >= this.canvas.width) {
                if (this.ballPosX <= 0) {
                    this.player2Score++;
                    this.scoreMessage =  this.player2_name + ' Scored!';
                } else {
                    this.player1Score++;
                    this.scoreMessage =  this.player1_name + ' Scored!';
                }
                this.resetBall();
                this.messageDisplayCounter = 180;
            }
        }
        else
            this.messageDisplayCounter--;

        // Draw ball
        this.drawBall();

        // Draw paddles
        this.ctx.fillRect(0, this.leftPaddleY, this.paddleWidth, this.paddleHeight);
        this.ctx.fillRect(this.canvas.width - this.paddleWidth, this.rightPaddleY, this.paddleWidth, this.paddleHeight);

        if (this.player1Score >= this.winningScore)
        {
            this.scoreMessage = this.player1_name + ' Wins!';
        }

        if (this.player2Score >= this.winningScore)
        {
            this.scoreMessage = this.player2_name + ' Wins!';
        }

        if (this.messageDisplayCounter > 0)
        {
            this.ctx.font = '30px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.scoreMessage, this.canvas.width / 2, this.canvas.height / 2);
        }
    
        // Always update score display and request next frame
        document.getElementById('player1_score').textContent = this.player1_name + `: ${this.player1Score}`;
        document.getElementById('player2_score').textContent = this.player2_name + `: ${this.player2Score}`;
        document.getElementById('winning_score').textContent = "Winning score" + `: ${this.winningScore}`;

        // Continue the game loop
        this.animationFrameId = requestAnimationFrame(this.drawPong.bind(this));
    },

    drawBall: function() {
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(this.ballPosX, this.ballPosY, 10, 0, Math.PI * 2, true);
        this.ctx.fill();
    },

    resetBall: function() {
        this.ballPosX = this.canvas.width / 2;
        this.ballPosY = this.canvas.height / 2;
        this.ballSpeedX = -this.ballSpeedX;
        this.ballSpeedY = this.ballSpeedY;
    },

    controlRightPaddleWithAI: function() {
        const movePaddle = (aiAction) => {
            // Calculate the end position early, considering the direction for continuous movement for 1 second.
            const endPosition = aiAction === 'UP' ? this.rightPaddleY - this.paddleSpeed * 60 : this.rightPaddleY + this.paddleSpeed * 60;
    
            if (this.aiPaddleMovementInterval) {
                clearInterval(this.aiPaddleMovementInterval);
            }

            // Use setInterval to move the paddle every frame (assuming 60fps) towards the end position for 1 second.
            this.aiPaddleMovementInterval = setInterval(() => {
                if (aiAction === 'UP')
                    this.rightPaddleY -= this.paddleSpeed;
                if (aiAction === 'DOWN')
                    this.rightPaddleY += this.paddleSpeed;
    
                // Clamp the paddle position within the canvas bounds.
                this.rightPaddleY = Math.max(Math.min(this.rightPaddleY, this.canvas.height - this.paddleHeight), 0);
    
                // Check if the paddle has moved for about 1 second or reached the end position, then clear the interval.
                if ((aiAction === 'UP' && this.rightPaddleY <= endPosition) || (aiAction === 'DOWN' && this.rightPaddleY >= endPosition)) {
                    clearInterval(this.aiPaddleMovementInterval);
                }
            }, 1000 / 60); // 60fps
        };
    
        const requestAIActionContinuously = () => {
            if (this.processAIActions && websocket.aiSocket.readyState === WebSocket.OPEN && this.gameMode === 'singlePlayer') {
                websocket.requestAIAction();
                websocket.onAIAction = (aiAction) => {
                    if (this.processAIActions) { // Check if AI actions should be processed
                        movePaddle(aiAction);
                    }
                    // Continue to request AI actions based on a flag
                    if (this.processAIActions) {
                        setTimeout(requestAIActionContinuously, 1000); // Adjust timing as needed
                    }
                };
            }
        }
    
        requestAIActionContinuously(); // Start the process initially
    },    

    stopControlAndDisconnect: function() {
        if (this.processAIActions === false && this.aiPaddleMovementInterval) {
            clearInterval(this.aiPaddleMovementInterval);
            this.aiPaddleMovementInterval = null;
        }
        this.processAIActions = false;
    
        if (this.aiActionInterval) {
            clearInterval(this.aiActionInterval);
        }
    },    

};