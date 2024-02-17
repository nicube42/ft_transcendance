const game = {

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
    messageDisplayCounter: 0,
    animationFrameId: null,
    ballspeed_save: 5,

    init: function() {
        this.canvas = document.getElementById('pong');
        if (this.canvas.getContext) {
            this.ctx = this.canvas.getContext('2d');
            this.resetVars();
            this.drawPong();
        }
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

        // Attach keyboard event listeners
        window.addEventListener('keydown', e => {
            switch(e.key) {
                case 'ArrowUp':
                    this.rightPaddleY = Math.max(this.rightPaddleY - this.paddleSpeed, 0);
                    break;
                case 'ArrowDown':
                    this.rightPaddleY = Math.min(this.rightPaddleY + this.paddleSpeed, this.canvas.height - this.paddleHeight);
                    break;
                case 'w':
                    this.leftPaddleY = Math.max(this.leftPaddleY - this.paddleSpeed, 0);
                    break;
                case 's':
                    this.leftPaddleY = Math.min(this.leftPaddleY + this.paddleSpeed, this.canvas.height - this.paddleHeight);
                    break;
            }
        });
    },

    drawPong: function() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.messageDisplayCounter === 0)
        {
            if (this.player1Score >= this.winningScore || this.player2Score >= this.winningScore)
            {
                this.resetVars();
                ui.showSection('homepage');
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
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(this.ballPosX, this.ballPosY, 10, 0, Math.PI * 2, true);
        this.ctx.fill();

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

    resetBall: function() {
        this.ballPosX = this.canvas.width / 2;
        this.ballPosY = this.canvas.height / 2;
        this.ballSpeedX = -this.ballSpeedX;
        this.ballSpeedY = this.ballSpeedY;
    }
};

game.init();
