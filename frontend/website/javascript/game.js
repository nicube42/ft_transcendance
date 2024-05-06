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
    isPlaying: false,

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
    
    init: async function() {
        await settings.populateSettings();
        stats.initStats();
        this.canvas = document.getElementById('pong');
        if (this.canvas.getContext) {
            this.ctx = this.canvas.getContext('2d');
            this.resetVars();
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
            gameSocket.retrieveGameSettings(gameSocket.currentRoom);
        }
    },

    updateGameSettings: function(settings) {
        this.settings = settings;
        this.settings.ballSpeed = settings.ballSpeed;
        this.settings.paddleSpeed = settings.paddleSpeed;
        this.ballSpeedX = settings.ballSpeed / 2;
        this.ballSpeedY = settings.ballSpeed / 2;
        this.ballSpeedMax = this.ballSpeedX * 1.4;
        this.paddleSpeed = settings.paddleSpeed;
        this.winningScore = settings.winningScore;
        if (this.gameMode === 'distant') {
            this.fetchPlayerNames();
        } else {
            auth.retrieveInfos().then(userInfo => {
                if (!userInfo)
                    return;
                this.player1_name = userInfo.username;
            });
            this.player2_name = "opponent";
        }
        this.withBonus = settings.bonus;
    },

    fetchPlayerNames: async function () {
        const userInfo = await auth.retrieveInfos();
        const opponentName = await auth.get_opponent_name();

        if (userInfo && userInfo.username && opponentName && opponentName.other_player) {
            if (this.playerRole === 'left') {
                this.player1_name = userInfo.username;
                this.player2_name = opponentName.other_player;
            } else {
                this.player1_name = opponentName.other_player;
                this.player2_name = userInfo.username;
            }
        } else {
            setTimeout(this.fetchPlayerNames, 1000);
        }
    },
    

    resetVars: function() {
        this.ballSpeedX = this.settings.ballSpeed / 2;
        this.ballSpeedY = this.settings.ballSpeed / 2;
        this.paddleSpeed = this.settings.paddleSpeed;
        this.winningScore = this.settings.winningScore;
        this.ballSpeedMax = this.ballSpeedX * 1.4;
        this.ballPosX = this.canvas.width / 2;
        this.ballPosY = this.canvas.height / 2;
        this.leftPaddleY = (this.canvas.height - this.paddleHeight) / 2;
        this.rightPaddleY = (this.canvas.height - this.paddleHeight) / 2;
        this.player1Score = 0;
        this.player2Score = 0;
        this.scoreMessage = '';
        this.messageDisplayCounter = 0;
        if (this.gameMode === 'distant') {
            this.fetchPlayerNames();
        } else {
            auth.retrieveInfos().then(userInfo => {
                if (!userInfo)
                    return;
                this.player1_name = userInfo.username;
            });
            this.player2_name = "opponent";
        }
        this.aiPaddleDirection = 1;
        this.leftPaddleMovingUp = false;
        this.leftPaddleMovingDown = false;
        this.rightPaddleMovingUp = false;
        this.rightPaddleMovingDown = false;
        this.paddleMoving = false;
        this.restart_ai = true;
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

                    }
                    else if (game.playerRole === 'right' && !this.rightPaddleMovingDown){
                        this.rightPaddleMovingUp = true;
                    }
                    break;
                case 's':
                    direction = 'down';
                    if (game.playerRole === 'left' && !this.leftPaddleMovingUp){
                        this.leftPaddleMovingDown = true;
                    }
                    else if (game.playerRole === 'right' && !this.rightPaddleMovingUp) {
                        this.rightPaddleMovingDown = true;
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
                    }
                    else {
                        this.rightPaddleMovingUp = false;
                    }

                    break;
                case 's':
                    direction = 'down';
                    if (game.playerRole === 'left') {
                        this.leftPaddleMovingDown = false;
                    }
                    else {
                        this.rightPaddleMovingDown = false;
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
        if (this.gameMode !== 'singlePlayer')
        {
            if (this.rightPaddleMovingUp) {
                this.rightPaddleY = Math.max(this.rightPaddleY - this.paddleSpeed, 0);
            }
            if (this.rightPaddleMovingDown) {
                this.rightPaddleY = Math.min(this.rightPaddleY + this.paddleSpeed, this.canvas.height - this.paddleHeight);
            }
        }
    },

    pause: function() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            auth.updateUserGameStatus('false');
            this.isPlaying = false;
            this.resetVars();
            this.stopControlAndDisconnect();
        }
    },
    
    resume: function() {
        if (!this.animationFrameId) {
            this.resetVars();
            this.drawPong();
            this.isPlaying = true;
            auth.updateUserGameStatus('true');
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
        const x = Math.floor(Math.random() * (this.canvas.width - 20)) + 10;
        const y = Math.floor(Math.random() * (this.canvas.height - 20)) + 10;
        return { x, y };
    },

    attemptBonusGeneration: function() {
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
            gameSocket.sendBonusState(this.bonusGreen, this.bonusRed);
        }
    
        this.nextBonusTimeout = setTimeout(() => {
            this.bonusGreen.active = false;
            this.bonusRed.active = false;
        }, 9000);
    },

    modifieAngle: function (impactPointY, paddleCenter){
        let refractionAngle = ((impactPointY - paddleCenter) / (this.paddleHeight / 2)) * 70;
        let radianAngle = (refractionAngle * Math.PI) / 180;
        this.ballSpeedX *= -1;
        if (Math.abs(this.ballSpeedX) < 15){
            this.ballSpeedX > 0 ? this.ballSpeedX += 1 : this.ballSpeedX -= 1;
        }
        this.ballSpeed = Math.abs(this.ballSpeedX / Math.cos(radianAngle));

        this.ballSpeedY = Math.sin(radianAngle) * this.ballSpeed;
    },

    updateBallPos: function (delta, obstacle, isX, paddleCenter) {
        let tmpX, tmpY;
        this.ballDirectionChanged = true;
        if (isX && paddleCenter){
            tmpX = obstacle;
            tmpY = this.ballPosY + this.ballSpeedY * delta;
            this.modifieAngle(tmpY, paddleCenter);  
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
        if (!this.ballPosX || !this.ballPosY)
            return;
        nextFrameBallX = this.ballPosX + this.ballSpeedX;
        nextFrameBallY = this.ballPosY + this.ballSpeedY;
        let deltaFrame = Infinity;

        if (nextFrameBallX - this.ballRadius < this.paddleWidth && nextFrameBallY > this.leftPaddleY && nextFrameBallY < this.leftPaddleY + this.paddleHeight){
            deltaFrame = Math.abs((this.paddleWidth - (this.ballPosX - this.ballRadius))/this.ballSpeedX);
            this.updateBallPos(deltaFrame, this.paddleWidth + this.ballRadius, true, this.leftPaddleY + this.paddleHeight / 2);
        }
        else if (nextFrameBallX + this.ballRadius > this.canvas.width - this.paddleWidth && nextFrameBallY > this.rightPaddleY && nextFrameBallY < this.rightPaddleY + this.paddleHeight){
            deltaFrame = Math.abs((this.canvas.width - this.paddleWidth - (this.ballPosX + this.ballRadius)) / this.ballSpeedX);
            this.updateBallPos(deltaFrame, this.canvas.width - this.paddleWidth - this.ballRadius, true,this.rightPaddleY + this.paddleHeight / 2);
        }
        else if (nextFrameBallY - this.ballRadius < 0){
            deltaFrame = Math.abs((0 - (this.ballPosY - this.ballRadius)) / this.ballSpeedY);
            this.updateBallPos(deltaFrame, this.ballRadius, false, null);
        }
        else if (nextFrameBallY + this.ballRadius > this.canvas.height){
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
        console.log(this.ballSpeedX);
    },

    drawPong: function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (!this.bonusTouched) {
            this.ball_color = 'white';
        }
        if ((this.player1Score >= this.winningScore || this.player2Score >= this.winningScore)) {
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
            }
    
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
    
        if (this.withBonus) {
            this.attemptBonusGeneration();
    
            if (this.bonusGreen.active) {
                this.drawBonus(this.bonusGreen);
            } else if (this.bonusRed.active) {
                this.drawBonus(this.bonusRed);
            }
        }
    
        this.checkBonusCollision();
        this.movePaddles();
    
        this.ctx.fillStyle = 'white';
    
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
    
        document.getElementById('player1_name').textContent = this.player1_name + `: ${this.player1Score}`;
        document.getElementById('player2_name').textContent = this.player2_name + `: ${this.player2Score}`;
        document.getElementById('winning_score').textContent = "Winning score" + `: ${this.winningScore}`;
    
        this.frame++;
        if (this.frame >= Number.MAX_SAFE_INTEGER) {
            this.frame = 0;
        }
        this.ballDirectionChanged = false;
    
        var self = this;
        setTimeout(function() {
            self.animationFrameId = requestAnimationFrame(self.drawPong.bind(self));
        }, 1000 / 60);
    },    

    drawBall: function() {
        this.ctx.fillStyle = this.ball_color;
        this.ctx.beginPath();
        this.ctx.arc(this.ballPosX, this.ballPosY, this.ballRadius, 0, Math.PI * 2, true);
        this.ctx.fill();
    },

	resetBall: function(direction) {
        stats.updateGameRestart();

		this.ballPosX = this.canvas.width / 2;
		this.ballPosY = this.canvas.height / 2;
	
        this.ballSpeed = this.settings.ballSpeed;
		this.ballSpeedX = this.settings.ballSpeed / 2;
        this.ballSpeedY = this.settings.ballSpeed / 2;
	
		this.ball_color = 'white';
	
		if (direction === 'right') {
			this.ballSpeedX = Math.abs(this.ballSpeedX);
		}
        else {
            this.ballSpeedX = - Math.abs(this.ballSpeedX);
        }
	},

    controlRightPaddleWithAI: function() {
        const movePaddle = (aiAction) => {
            if (this.aiPaddleMovementInterval) {
                clearInterval(this.aiPaddleMovementInterval);
            }
        
            this.aiPaddleMovementInterval = setInterval(() => {
                const paddleCenter = this.rightPaddleY + this.paddleHeight / 2;


                if (paddleCenter < this.predictedPos && aiAction === 'DOWN') {
                    this.rightPaddleY += this.paddleSpeed;
                } else if (paddleCenter > this.predictedPos && aiAction === 'UP') {
                    this.rightPaddleY -= this.paddleSpeed;
                }
        
                this.rightPaddleY = Math.max(Math.min(this.rightPaddleY, this.canvas.height - this.paddleHeight), 0);
        
                if (Math.abs(paddleCenter - this.predictedPos) < this.paddleSpeed / 2) {
                    clearInterval(this.aiPaddleMovementInterval);
                }
            }, 1000 / 60);
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
        
                    if (this.processAIActions && predictedPos != -1) {
                        movePaddle(aiAction);
                    }

                    if (this.processAIActions) {
                        this.update_ai = true;
                        setTimeout(requestAIActionContinuously, 1000);
                    }
                };
            }
        };
        
        requestAIActionContinuously();
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
        if (!bonus.active || this.bonusTouched) {
            return;
        }
        const pulsatingRadius = bonus.baseRadius + Math.sin(this.frame * 0.1) * 5;
        this.ctx.beginPath();
        this.ctx.arc(bonus.x, bonus.y, pulsatingRadius, 0, Math.PI * 5);
        this.ctx.fillStyle = bonus.color;
        this.ctx.fill();
    },
    
	checkBonusCollision: function() {
		var that = this;
	
		if (Math.abs(this.ballPosX - this.bonusGreen.x) < this.bonusGreen.radius && Math.abs(this.ballPosY - this.bonusGreen.y) < this.bonusGreen.radius && this.bonusGreen.active) {
			this.ballSpeedX *= 1.5;
			this.ballSpeedY *= 1.5;
			this.ball_color = 'green';
			this.bonusGreen.active = false;
			this.bonusTouched = true;
			setTimeout(function() {
				that.ballSpeedX /= 1.5;
				that.ballSpeedY /= 1.5;
				that.ball_color = 'white';
				that.bonusTouched = false;
				that.attemptBonusGeneration();
			}, 10000);
		}
	
		if (Math.abs(this.ballPosX - this.bonusRed.x) < this.bonusRed.radius && Math.abs(this.ballPosY - this.bonusRed.y) < this.bonusRed.radius && this.bonusRed.active) {
			this.ballSpeedX /= 1.5;
			this.ballSpeedY /= 1.5;
			this.ball_color = 'red';
			this.bonusRed.active = false;
			this.bonusTouched = true;
			setTimeout(function() {
				that.ballSpeedX *= 1.5;
				that.ballSpeedY *= 1.5;
				that.ball_color = 'white';
				that.bonusTouched = false;
				that.attemptBonusGeneration();
			}, 10000);
		}
	},	
};