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
                ball_y: game.ballPosY,
                paddle_y: game.rightPaddleY,
                paddle_height: game.paddleHeight
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