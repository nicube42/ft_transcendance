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
    ballRadius: 10,
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
    frame: 0,
    ball_color: 'white',
    currentBonus: null,
    nextBonusTimeout: null,
    bonusTouched: false,

    bonusGreen: {
        x: 100,
        y: 100,
        baseRadius: 10,
        radius: 10,
        color: 'green',
        active: false
    },
    
    bonusRed: {
        x: 200,
        y: 200,
        baseRadius: 10,
        radius: 10,
        color: 'red',
        active: false
    },
    
    
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

    generateRandomCoordinates: function() {
        // créé coordonnées random
        const x = Math.floor(Math.random() * (this.canvas.width - 20)) + 10; // 10 pour éviter que le bonus ne se trouve trop près du bord sinn ca beug
        const y = Math.floor(Math.random() * (this.canvas.height - 20)) + 10;
        return { x, y };
    },

    attemptBonusGeneration: function() {
        // Only proceed if no bonus is currently active
        if (!this.bonusGreen.active && !this.bonusRed.active && !this.bonusTouched) {
            this.generateRandomBonus();
        }
    },
    
    generateRandomBonus: function() {
        if (this.nextBonusTimeout) {
            clearTimeout(this.nextBonusTimeout);
        }
        
        const randomBonusType = Math.random() < 0.5 ? 'green' : 'red';
        const randomCoordinates = this.generateRandomCoordinates();
        
        this.bonusGreen.active = false;
        this.bonusRed.active = false;
        
        if (randomBonusType === 'green') {
            this.bonusGreen = { ...this.bonusGreen, ...randomCoordinates, active: true };
        } else {
            this.bonusRed = { ...this.bonusRed, ...randomCoordinates, active: true };
        }
    
        this.nextBonusTimeout = setTimeout(() => {
            this.bonusGreen.active = false;
            this.bonusRed.active = false;
        }, 9000);
    },

    updateBallPos: function (delta, obstacle, isX, paddleCenter) {
        let tmpX, tmpY;
        console.log(paddleCenter);
        console.log("delta:",delta);
        if (isX && paddleCenter){
            tmpX = obstacle;
            tmpY = this.ballPosY + this.ballSpeedY * delta;
            this.ballSpeedX *= -1;
        }   
        else {
            tmpX = this.ballPosX + this.ballSpeedX * delta;
            tmpY = obstacle;
            this.ballSpeedY *= -1;
        }
        this.ballPosX = tmpX + this.ballSpeedX * (1 - delta);
        this.ballPosY = tmpY + this.ballSpeedY * (1 - delta);
        
        
    },

    checkColisions: function () {
        //check the potential nextFrame position if no collisions occurs
        nextFrameBallX = this.ballPosX + this.ballSpeedX;
        nextFrameBallY = this.ballPosY + this.ballSpeedY;
        let deltaFrame = Infinity;
 
        if (nextFrameBallX - this.ballRadius < this.paddleWidth && nextFrameBallY > this.leftPaddleY && nextFrameBallY < this.leftPaddleY + this.paddleHeight){
            //check colision with left paddle
            deltaFrame = Math.abs((this.paddleWidth - (this.ballPosX - this.ballRadius))/this.ballSpeedX);
            this.updateBallPos(deltaFrame, this.paddleWidth + this.ballRadius, true, this.leftPaddleY + this.paddleHeight / 2);
        }
        else if (nextFrameBallX + this.ballRadius > this.canvas.width - this.paddleWidth && nextFrameBallY > this.rightPaddleY && nextFrameBallY < this.rightPaddleY + this.paddleHeight){
            //check collision with right paddle
            deltaFrame = Math.abs((this.canvas.width - this.paddleWidth - (this.ballPosX + this.ballRadius)) / this.ballSpeedX);
            this.updateBallPos(deltaFrame, this.canvas.width - this.paddleWidth - this.ballRadius, true,this.rightPaddleY + this.paddleHeight / 2);
        }
        else if (nextFrameBallY - this.ballRadius < 0){
            //check colision with up wall
            deltaFrame = Math.abs((0 - (this.ballPosY - this.ballRadius)) / this.ballSpeedY);
            this.updateBallPos(deltaFrame, this.ballRadius, false, null);
        }
        else if (nextFrameBallY + this.ballRadius > this.canvas.height){
            //check colision with bottom wall
            deltaFrame = Math.abs((this.canvas.height - (this.ballPosY + this.ballRadius)) / this.ballSpeedY);
            this.updateBallPos(deltaFrame, this.canvas.height - this.ballRadius, false, null);
        }
        else {
            this.ballPosX = nextFrameBallX;
            this.ballPosY = nextFrameBallY;
        }
    },

    drawPong: function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.messageDisplayCounter === 0)
        {
            this.frame++;
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
            // TODO: check the nextframe collision before set the new position of the ball

            this.checkColisions();
            //if (this.ballPosY <= 0 || this.ballPosY >= this.canvas.height) {
            //    this.ballSpeedY = -this.ballSpeedY;
            //}

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

        this.drawBall();

        // bonus logic

        this.attemptBonusGeneration();

        if (this.bonusGreen.active) {
            this.drawBonus(this.bonusGreen);
        } else if (this.bonusRed.active) {
            this.drawBonus(this.bonusRed);
        }
    
        this.checkBonusCollision();
        this.displayPoints();
    
        this.ctx.fillStyle = 'white';

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

        this.frame++;
        if (this.frame >= Number.MAX_SAFE_INTEGER) {
            this.frame = 0; // Reset frame counter to avoid overflow
        }
        this.animationFrameId = requestAnimationFrame(this.drawPong.bind(this));
    },

    drawBall: function() {
        this.ctx.fillStyle = this.ball_color;
        this.ctx.beginPath();
        this.ctx.arc(this.ballPosX, this.ballPosY, this.ballRadius, 0, Math.PI * 2, true);
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

    drawBonus: function(bonus) {
        // Assuming `bonusTouched` is a boolean flag indicating if a bonus has been touched
        if (!bonus.active || this.bonusTouched) {
            return; // Skip drawing if the bonus is not active or if any bonus has been touched
        }
        const pulsatingRadius = bonus.baseRadius + Math.sin(this.frame * 0.1) * 2; // Adjust for pulsating effect
        this.ctx.beginPath();
        this.ctx.arc(bonus.x, bonus.y, pulsatingRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = bonus.color;
        this.ctx.fill();
    },
    
    checkBonusCollision: function() {
        var that = this; // Capture the correct context of 'this' to use inside setTimeout
    
        if (Math.abs(this.ballPosX - this.bonusGreen.x) < this.bonusGreen.radius && Math.abs(this.ballPosY - this.bonusGreen.y) < this.bonusGreen.radius && this.bonusGreen.active) {
            this.ballSpeedX *= 1.5;
            this.ballSpeedY *= 1.5;
            this.bonusGreen.active = false;
            this.bonusTouched = true;
            setTimeout(function() {
                that.ballSpeedX /= 1.5;
                that.ballSpeedY /= 1.5;
                that.bonusTouched = false; // Use 'that' instead of 'this'
                that.attemptBonusGeneration(); // Try generating a new bonus
            }, 10000); // 10 seconds
        }
    
        if (Math.abs(this.ballPosX - this.bonusRed.x) < this.bonusRed.radius && Math.abs(this.ballPosY - this.bonusRed.y) < this.bonusRed.radius && this.bonusRed.active) {
            this.ballSpeedX /= 1.5;
            this.ballSpeedY /= 1.5;
            this.bonusRed.active = false;
            this.bonusTouched = true;
            setTimeout(function() {
                that.ballSpeedX *= 1.5;
                that.ballSpeedY *= 1.5;
                that.bonusTouched = false; // Use 'that' instead of 'this'
                that.attemptBonusGeneration(); // Try generating a new bonus
            }, 10000); // 10 seconds
        }
    
        // Ball color logic remains the same
        if (Math.abs(this.ballSpeedX) == this.settings.ballSpeed / 2)
            this.ball_color = 'white';
        else if (Math.abs(this.ballSpeedX) > this.settings.ballSpeed / 2)
            this.ball_color = 'green';
        else if (Math.abs(this.ballSpeedX) < this.settings.ballSpeed / 2)
            this.ball_color = 'red';
    },      
    
    displayPoints: function() {
        if (game.player1Score % 5 === 0 && game.player1Score > 0) {
            // Afficher les points lorsque le joueur 1 marque 5 points
            alert('Player 1 scores 5 points!');
        }
        if (game.player2Score % 5 === 0 && game.player2Score > 0) {
            // Afficher les points lorsque le joueur 2 marque 5 points
            alert('Player 2 scores 5 points!');
        }
    },

};
