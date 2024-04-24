const game = {

    gameMode: 'multiplayer',
    ballDirectionChanged: false,

    settings: {
        player1Name: 'Player 1',
        player2Name: 'Player 2',
        ballSpeed: 5,
        paddleSpeed: 15,
        winningScore: 5,
    },

    predictedPos: null,
    update_ai: true,

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
    leftPaddleMovingUp: false,
    leftPaddleMovingDown: false,
    rightPaddleMovingUp: false,
    rightPaddleMovingDown: false,
    paddleMoving: false,

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
    
    
    // init: function() {
    //     this.canvas = document.getElementById('pong');
    //     if (this.canvas.getContext) {
    //         this.ctx = this.canvas.getContext('2d');
    //         this.resetVars();
    //         this.drawPong();
    //         window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    //         window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    //         window.addEventListener('keydown', this.handleKeyDown.bind(this));
    //         window.addEventListener('keyup', this.handleKeyUp.bind(this));
    //     }
    // },

    init: async function() {
        await settings.populateSettings();  // Populate settings before the game starts.
        stats.initStats();                  // Initialize game stats.
        this.canvas = document.getElementById('pong');
        if (this.canvas.getContext) {
            this.ctx = this.canvas.getContext('2d');
            this.resetVars();
            //this.updateGameSettings();
            this.drawPong();
            window.removeEventListener('keydown', this.handleKeyDown.bind(this));
            window.removeEventListener('keyup', this.handleKeyUp.bind(this));
            window.addEventListener('keydown', this.handleKeyDown.bind(this));
            window.addEventListener('keyup', this.handleKeyUp.bind(this));
        }
    },

    setGameMode: function(mode) {
        this.gameMode = mode;
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
        this.withBonus = settings.bonus;
        console.log('withBonus', this.withBonus);
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
        this.player1_name = this.settings.player1Name;
        this.player2_name = this.settings.player2Name;
        this.aiPaddleDirection = 1;
        this.leftPaddleMovingUp = false;
        this.leftPaddleMovingDown = false;
        this.rightPaddleMovingUp = false;
        this.rightPaddleMovingDown = false;
        this.paddleMoving = false;
        this.restart_ai = true;
        // stats.endTime = null;

    },

    handleKeyDown: function (e) {

        let direction = null;
        let keyEvent = "pressed";


        if (game.gameMode === 'distant') {
            this.paddleMoving = true;
            switch(e.key) {
                case 'w':
                    direction = 'up';
                    if (game.playerRole === 'left' && !this.leftPaddleMovingDown) {
                        this.leftPaddleMovingUp = true;
                        //gameSocket.sendPaddleMovement(direction, keyEvent);

                    }
                    else if (game.playerRole === 'right' && !this.rightPaddleMovingDown){
                        this.rightPaddleMovingUp = true;
                        //gameSocket.sendPaddleMovement(direction, keyEvent);
                    }
                    break;
                case 's':
                    direction = 'down';
                    if (game.playerRole === 'left' && !this.leftPaddleMovingUp){
                        this.leftPaddleMovingDown = true;
                        //gameSocket.sendPaddleMovement(direction, keyEvent);
                    }
                    else if (game.playerRole === 'right' && !this.rightPaddleMovingUp) {
                        this.rightPaddleMovingDown = true;
                        //gameSocket.sendPaddleMovement(direction, keyEvent);
                    }
                    break;
                
            }
    
        }
        else {
            switch (e.key) {
                case 'ArrowUp':
                    this.rightPaddleMovingUp = true;
                    break;
                case 'ArrowDown':
                    this.rightPaddleMovingDown = true;
                    break;
                case 'w':
                    this.leftPaddleMovingUp = true;
                    break;
                case 's':
                    this.leftPaddleMovingDown = true;
                    break;
            }
        }
    },

    handleKeyUp: function (e) {
        let direction = null;
        let keyEvent = "unpressed"


        if (game.gameMode === 'distant') {
            this.paddleMoving = false;
            gameSocket.sendPaddlePos(this.playerRole, this.leftPaddleY, this.rightPaddleY);
            switch(e.key) {
                case 'w':
                    direction = 'up';
                    if (game.playerRole === 'left'){
                        this.leftPaddleMovingUp = false;
                        //gameSocket.sendPaddleMovement(direction, keyEvent);
                    }
                    else {
                        this.rightPaddleMovingUp = false;
                        //gameSocket.sendPaddleMovement(direction, keyEvent);
                    }

                    break;
                case 's':
                    direction = 'down';
                    if (game.playerRole === 'left') {
                        this.leftPaddleMovingDown = false;
                        //gameSocket.sendPaddleMovement(direction, keyEvent);
                    }
                    else {
                        this.rightPaddleMovingDown = false;
                        //gameSocket.sendPaddleMovement(direction, keyEvent);
                    }

                    break;
                
            }

        }
        if (this.gameMode !== 'distant'){
            switch (e.key) {
                case 'ArrowUp':
                    this.rightPaddleMovingUp = false;
                    break;
                case 'ArrowDown':
                    this.rightPaddleMovingDown = false;
                    break;
                case 'w':
                    this.leftPaddleMovingUp = false;
                    break;
                case 's':
                    this.leftPaddleMovingDown = false;
                    break;
            }
        }
    },


    movePaddles: async function () {
        if (this.leftPaddleMovingUp) {
            this.leftPaddleY = Math.max(this.leftPaddleY - this.paddleSpeed, 0);
        }
        if (this.leftPaddleMovingDown) {
            this.leftPaddleY = Math.min(this.leftPaddleY + this.paddleSpeed, this.canvas.height - this.paddleHeight);
        }
        if (this.rightPaddleMovingUp) {
            this.rightPaddleY = Math.max(this.rightPaddleY - this.paddleSpeed, 0);
        }
        if (this.rightPaddleMovingDown) {
            this.rightPaddleY = Math.min(this.rightPaddleY + this.paddleSpeed, this.canvas.height - this.paddleHeight);
        }
        
    },

    pause: function() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            console.log('Game paused');
            auth.updateUserGameStatus('false');;
            this.resetVars();
            this.stopControlAndDisconnect();
        }
    },
    
    resume: function() {
        if (!this.animationFrameId) {
            this.resetVars();
            this.drawPong();
            auth.updateUserGameStatus('true');
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
        if (this. gameMode === 'distant' && this.playerRole === 'right'){
            return ;
        }
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
        if (this.gameMode === 'distant'){
            console.log('send game bonus');
            gameSocket.sendBonusState(this.bonusGreen, this.bonusRed);
        }
    
        this.nextBonusTimeout = setTimeout(() => {
            this.bonusGreen.active = false;
            this.bonusRed.active = false;
        }, 9000);
    },

    updateBallPos: function (delta, obstacle, isX, paddleCenter) {
        let tmpX, tmpY;
        this.ballDirectionChanged = true;
        const originalSpeed = Math.sqrt(this.ballSpeedX * this.ballSpeedX + this.ballSpeedY * this.ballSpeedY);
        if (isX && paddleCenter){
            tmpX = obstacle;
            tmpY = this.ballPosY + this.ballSpeedY * delta;
            let currentAngle = Math.atan2(this.ballSpeedY, this.ballSpeedX);
            let refraction_coefficient = Math.abs((this.ballPosY - paddleCenter) / (this.paddleHeight / 2));
            let newAngle = currentAngle + refraction_coefficient / 2; // change le coef pr que l'angle soit + +
            this.ballSpeedX = -originalSpeed * Math.cos(newAngle);
            this.ballSpeedY = originalSpeed * Math.sin(newAngle);
            console.log(Math.sqrt(this.ballSpeedX * this.ballPosX + this.ballSpeedY * this.ballPosY));
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
		if (!this.bonusTouched) {
			this.ball_color = 'white';
		}
    },

    drawPong: function() {
        console.log('BONUS IS', this.withBonus);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		// Réinitialise la couleur de la balle si aucun bonus n'est touché
		if (!this.bonusTouched) {
			this.ball_color = 'white';
		}
        if ((this.player1Score >= this.winningScore || this.player2Score >= this.winningScore) && !stats.endTime) {
            stats.recordEndTime();
            stats.displayEndGameStats();
            this.resetVars();
            return;
        }
        if (this.messageDisplayCounter === 0)
        {
            this.frame++;
            if (this.gameMode === 'distant' && this.paddleMoving){
                gameSocket.sendPaddlePos(this.playerRole, this.leftPaddleY, this.rightPaddleY);
            }
            this.checkColisions();
            if (this.gameMode === 'distant' && this.ballPosX < this.canvas.width - 10 && this.ballPosX > 10)
            {
                gameSocket.sendBallState();
                console.log("bong");
            }


            // Score update logic
            if (this.ballPosX <= 0 || this.ballPosX >= this.canvas.width) {
                if (this.ballPosX <= 0) {
                    this.player2Score++;
                    this.scoreMessage =  this.player2_name + ' Scored!';
                    this.resetBall('right');
                } else {
                    this.player1Score++;
                    this.scoreMessage =  this.player1_name + ' Scored!';
                    this.resetBall('left');
                }
                this.messageDisplayCounter = 180;
            }
        }
        else
            this.messageDisplayCounter--;

        this.drawBall();








                this.drawPredictedPosition(this.ctx, this.predictedPos);











        // bonus logic
        if (this.withBonus) {
            this.attemptBonusGeneration();
    
            if (this.bonusGreen.active) {
                this.drawBonus(this.bonusGreen);
            } else if (this.bonusRed.active) {
                this.drawBonus(this.bonusRed);
            }
        }
    
        this.checkBonusCollision();
        //this.displayPoints();
        this.movePaddles();


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
        this.ballDirectionChanged = false;
        this.animationFrameId = requestAnimationFrame(this.drawPong.bind(this));
    },

    drawBall: function() {
        this.ctx.fillStyle = this.ball_color;
        this.ctx.beginPath();
        this.ctx.arc(this.ballPosX, this.ballPosY, this.ballRadius, 0, Math.PI * 2, true);
        this.ctx.fill();
    },

	resetBall: function(direction) {
		// Réinitialise la position de la balle au centre du canvas
        stats.updateGameRestart();  // Update game stats each time the ball is reset.

		this.ballPosX = this.canvas.width / 2;
		this.ballPosY = this.canvas.height / 2;
	
		// Réinitialise la vitesse de la balle à la valeur initiale de configuration
		this.ballSpeedX = this.settings.ballSpeed / 2;
		//this.ballSpeedY = Math.random() > 0.5 ? this.settings.ballSpeed / 2 : -this.settings.ballSpeed / 2;  // Ajoute une variation aléatoire pour la direction verticale
	
		// Réinitialise la couleur de la balle
		this.ball_color = 'white';
	
		// Optionnel : Alterner la direction initiale de la balle horizontalement à chaque point marqué
		if (direction === 'right') {
			this.ballSpeedX = Math.abs(this.ballSpeedX);
		}
        else {
            this.ballSpeedX = - Math.abs(this.ballSpeedX);
        }
	},
	

    // controlRightPaddleWithAI: function(predictedPosY) {
    //     const direction = this.rightPaddleY + this.paddleHeight / 2 < predictedPosY ? 'DOWN' : 'UP';
    
    //     // Calculate the desired end position for the paddle
    //     const framesPerSecond = 60;
    //     const intervalTime = 1000 / framesPerSecond;
    //     let hasReachedDestination = false;
    
    //     if (this.aiPaddleMovementInterval) {
    //         clearInterval(this.aiPaddleMovementInterval);
    //     }
    
    //     this.aiPaddleMovementInterval = setInterval(() => {
    //         if (direction === 'UP' && this.rightPaddleY > 0) {
    //             this.rightPaddleY -= this.paddleSpeed;
    //             if (this.rightPaddleY + this.paddleHeight / 2 <= predictedPosY) {
    //                 hasReachedDestination = true;
    //             }
    //         } else if (direction === 'DOWN' && this.rightPaddleY < this.canvas.height - this.paddleHeight) {
    //             this.rightPaddleY += this.paddleSpeed;
    //             if (this.rightPaddleY + this.paddleHeight / 2 >= predictedPosY) {
    //                 hasReachedDestination = true;
    //             }
    //         }
    
    //         if (hasReachedDestination) {
    //             clearInterval(this.aiPaddleMovementInterval);
    //             this.aiPaddleMovementInterval = null;
    //             console.log('Paddle reached the predicted position:', predictedPosY);
    //         }
    //     }, intervalTime);
    // },    
    

    controlRightPaddleWithAI: function() {
        const movePaddle = (aiAction) => {
            // Use clearInterval to stop any existing paddle movement
            if (this.aiPaddleMovementInterval) {
                clearInterval(this.aiPaddleMovementInterval);
            }
        
            // Define the movement function
            this.aiPaddleMovementInterval = setInterval(() => {
                // Determine the current center of the paddle
                const paddleCenter = this.rightPaddleY + this.paddleHeight / 2;
        
                // Determine if the paddle needs to move up or down to reach the predicted position
                if (paddleCenter < this.predictedPos && aiAction === 'DOWN') {
                    this.rightPaddleY += this.paddleSpeed;
                } else if (paddleCenter > this.predictedPos && aiAction === 'UP') {
                    this.rightPaddleY -= this.paddleSpeed;
                }
        
                // Clamp the paddle position within the canvas bounds to prevent it from going off-screen
                this.rightPaddleY = Math.max(Math.min(this.rightPaddleY, this.canvas.height - this.paddleHeight), 0);
        
                // Check if the paddle has aligned with the predicted position or needs to stop moving
                if (Math.abs(paddleCenter - this.predictedPos) < this.paddleSpeed / 2) {
                    clearInterval(this.aiPaddleMovementInterval);
                }
            }, 1000 / 60); // Run this interval at a rate corresponding to 60fps
        };        
        
        const requestAIActionContinuously = () => {
            if (this.processAIActions && websocket.aiSocket.readyState === WebSocket.OPEN && this.gameMode === 'singlePlayer') {
                websocket.requestAIAction();
                this.update_ai = false;
                websocket.onAIAction = (response) => {
                    const data = JSON.parse(response);
                    const aiAction = data.action;
                    const predictedPos = data.predicted_pos_y;
                    this.predictedPos = predictedPos;
                    const paddleCenter = this.rightPaddleY + this.paddleHeight / 2;
        
                    if (this.processAIActions && predictedPos != -1) { // Check if AI actions should be processed
                        movePaddle(aiAction);
                    }
        
                    // Continue to request AI actions based on a flag
                    if (this.processAIActions) {
                        console.log('Requesting AI action again');
                        this.update_ai = true;
                        setTimeout(requestAIActionContinuously, 1000);
                    }
                };
            }
        };
        
        requestAIActionContinuously(); // Start the process initially
    },

    drawPredictedPosition: function(ctx, predictedY) {
        ctx.fillStyle = 'red'; // Use red color to mark the predicted position
        ctx.beginPath();
        ctx.arc(this.canvas.width - 10, predictedY, 5, 0, 2 * Math.PI); // Draw a small circle at the right paddle's X and predicted Y
        ctx.fill();
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
        const pulsatingRadius = bonus.baseRadius + Math.sin(this.frame * 0.1) * 5; // Adjust for pulsating effect
        this.ctx.beginPath();
        this.ctx.arc(bonus.x, bonus.y, pulsatingRadius, 0, Math.PI * 5);
        this.ctx.fillStyle = bonus.color;
        this.ctx.fill();
    },
    
	checkBonusCollision: function() {
		var that = this; // Capture the correct context of 'this' to use inside setTimeout
	
		if (Math.abs(this.ballPosX - this.bonusGreen.x) < this.bonusGreen.radius && Math.abs(this.ballPosY - this.bonusGreen.y) < this.bonusGreen.radius && this.bonusGreen.active) {
			this.ballSpeedX *= 1.5;
			this.ballSpeedY *= 1.5;
			this.ball_color = 'green'; // Change the ball color to green when green bonus is touched
			this.bonusGreen.active = false;
			this.bonusTouched = true;
			setTimeout(function() {
				that.ballSpeedX /= 1.5;
				that.ballSpeedY /= 1.5;
				that.ball_color = 'white'; // Reset the ball color to white after bonus effect ends
				that.bonusTouched = false;
				that.attemptBonusGeneration(); // Try generating a new bonus
			}, 10000); // 10 seconds
		}
	
		if (Math.abs(this.ballPosX - this.bonusRed.x) < this.bonusRed.radius && Math.abs(this.ballPosY - this.bonusRed.y) < this.bonusRed.radius && this.bonusRed.active) {
			this.ballSpeedX /= 1.5;
			this.ballSpeedY /= 1.5;
			this.ball_color = 'red'; // Change the ball color to red when red bonus is touched
			this.bonusRed.active = false;
			this.bonusTouched = true;
			setTimeout(function() {
				that.ballSpeedX *= 1.5;
				that.ballSpeedY *= 1.5;
				that.ball_color = 'white'; // Reset the ball color to white after bonus effect ends
				that.bonusTouched = false;
				that.attemptBonusGeneration(); // Try generating a new bonus
			}, 10000); // 10 seconds
		}
	},	

};