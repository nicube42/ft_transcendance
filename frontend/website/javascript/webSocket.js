const websocket = {
    aiSocket: null, // Initialize as null to handle reconnection logic

    initialize: function() {
        // Close existing WebSocket connection if one exists and is open
        if (this.aiSocket && this.aiSocket.readyState === WebSocket.OPEN) {
            this.aiSocket.close();
        }

        // Create a new WebSocket connection
        this.aiSocket = new WebSocket("ws://localhost:5678/");

        this.aiSocket.onopen = () => {
            console.log("Connected to AI server");
        };

        this.aiSocket.onclose = (event) => {
            console.log("WebSocket closed. Attempting to reconnect...");
            // Use setTimeout to delay reconnection attempt
            setTimeout(() => this.initialize(), 3000); // Attempt to reconnect after 3 seconds
        };

        this.aiSocket.onerror = (error) => {
            console.log("WebSocket error:", error);
            // Optionally handle errors by closing socket to trigger reconnection in onclose handler
            this.aiSocket.close();
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
                paddle_left_y: game.leftPaddleY,
                paddle_height: game.paddleHeight,
                canvas_width: game.canvas.width,
                canvas_height: game.canvas.height,
                update_ai: game.update_ai,
            });
            this.aiSocket.send(message);
        } else {
            console.log("WebSocket is not open. Message not sent.");
        }
    },

    closeConnection: function() {
        if (this.aiSocket && this.aiSocket.readyState === WebSocket.OPEN) {
            this.aiSocket.close();
            console.log("Connection manually closed");
        } else {
            console.log("WebSocket was not open or already closing.");
        }
    }
};

// Initialize WebSocket connection
websocket.initialize();
