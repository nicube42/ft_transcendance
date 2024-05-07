const websocket = {
    aiSocket: null,

    initialize: function() {
        const wsScheme = window.location.protocol === "https:" ? "wss://" : "ws://";
        const backendHost = window.location.hostname;
        const url = `${wsScheme}${backendHost}:5678/ws/ai/`;

        if (this.aiSocket && this.aiSocket.readyState === WebSocket.OPEN) {
            this.aiSocket.close();
        }

        this.aiSocket = new WebSocket(url);

        this.aiSocket.onopen = () => {
        };

        this.aiSocket.onclose = (event) => {
            setTimeout(() => this.initialize(), 3000);
        };

        this.aiSocket.onerror = (error) => {
            this.aiSocket.close();
        };

        this.aiSocket.onmessage = (event) => {
            const aiAction = event.data;
            if (this.onAIAction) this.onAIAction(aiAction);
        };
    },

    requestAIAction: function() {
        if (this.aiSocket.readyState === WebSocket.OPEN) {
            console.log('send info to ia');
            const message = JSON.stringify({
                ball_pos_x: game.ballPosX,
                ball_pos_y: game.ballPosY,
                ball_speed_x: game.ballSpeedX,
                ball_speed_y: game.ballSpeedY,
                paddle_y: game.rightPaddleY,
                paddle_left_y: game.leftPaddleY,
                paddle_height: game.paddleHeight,
                canvas_width: game.canvas.width,
                canvas_height: game.canvas.height,
                update_ai: game.update_ai,
            });
            this.aiSocket.send(message);
        } else {
        }
    },

    closeConnection: function() {
        if (this.aiSocket && this.aiSocket.readyState === WebSocket.OPEN) {
            this.aiSocket.close();
        } else {
        }
    }
};
