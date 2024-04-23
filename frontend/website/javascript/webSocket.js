const websocket = {
    aiSocket: new WebSocket("ws://localhost:5678/"),

    initialize: function() {
        this.aiSocket.onopen = (event) => {
            console.log("Connected to AI server");
        };

        this.aiSocket.onmessage = (event) => {
            const aiAction = event.data;
            console.log("AI Action:", aiAction);
            if (this.onAIAction) this.onAIAction(aiAction);
        };
    },

    requestAIAction: function() {
        if (this.aiSocket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                ball_pos_x: game.ballPosX,
                ball_pos_y: game.ballPosY,
                ball_speed_x: game.ballSpeedX,
                ball_speed_y: game.ballSpeedY,
                paddle_y: game.rightPaddleY,
                paddle_height: game.paddleHeight,
                canvas_width: game.canvas.width,
                canvas_height: game.canvas.height,
            });
            this.aiSocket.send(message);
        }
    },

    closeConnection: function() {
        if (this.aiSocket.readyState === WebSocket.OPEN) {
            this.aiSocket.close();
            console.log("Connection closed");
        } else {
            console.log("WebSocket was not open.");
        }
    }
    
};