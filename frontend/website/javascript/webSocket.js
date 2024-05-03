const websocket = {
    aiSocket: null, // Initialize as null to handle reconnection logic

    initialize: function() {
        const wsScheme = window.location.protocol === "https:" ? "wss://" : "ws://";
        const backendHost = window.location.hostname; // Use hostname instead of host to avoid port number
        const url = `${wsScheme}${backendHost}:5678/ws/ai/`; // Adjusted URL for WebSocket path

        if (this.aiSocket && this.aiSocket.readyState === WebSocket.OPEN) {
            this.aiSocket.close();
        }

        this.aiSocket = new WebSocket(url);

        this.aiSocket.onopen = () => {
            console.log("Connected to AI server");
        };

        this.aiSocket.onclose = (event) => {
            console.log("WebSocket closed. Attempting to reconnect...");
            setTimeout(() => this.initialize(), 3000);
        };

        this.aiSocket.onerror = (error) => {
            console.log("WebSocket error:", error.message); // Log error message for better debugging
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


// const websocket = {
//     aiSocket: null,

//     initialize: function() {
//         const wsScheme = window.location.protocol === "https:" ? "wss://" : "ws://";
//         const backendHost = window.location.hostname; // Use hostname instead of host to avoid port number
//         const url = `${wsScheme}${backendHost}:5678/ws/ai/`; // Adjusted URL for WebSocket path

//         if (this.aiSocket && this.aiSocket.readyState === WebSocket.OPEN) {
//             this.aiSocket.close();
//         }

//         this.aiSocket = new WebSocket(url);

//         this.aiSocket.onopen = () => {
//             console.log("Connected to AI server");
//         };

//         this.aiSocket.onclose = (event) => {
//             console.log("WebSocket closed. Attempting to reconnect...");
//             setTimeout(() => this.initialize(), 3000);
//         };

//         this.aiSocket.onerror = (error) => {
//             console.log("WebSocket error:", error.message); // Log error message for better debugging
//             this.aiSocket.close();
//         };

//         this.aiSocket.onmessage = (event) => {
//             const aiAction = event.data;
//             console.log("AI Action:", aiAction);
//             if (this.onAIAction) this.onAIAction(aiAction);
//         };
//     },

//     requestAIAction: function(game) {
//         if (this.aiSocket.readyState === WebSocket.OPEN) { 
//             const message = JSON.stringify({
//                 ball_pos_x: game.ballPosX,
//                 ball_pos_y: game.ballPosY,
//                 ball_speed_x: game.ballSpeedX,
//                 ball_speed_y: game.ballSpeedY,
//                 paddle_y: game.rightPaddleY,
//                 paddle_left_y: game.leftPaddleY,
//                 paddle_height: game.paddleHeight,
//                 canvas_width: game.canvas.width,
//                 canvas_height: game.canvas.height,
//                 update_ai: game.update_ai,
//             });
//             this.aiSocket.send(message);
//         } else {
//             console.log("WebSocket is not open. Message not sent.");
//         }
//     },

//     closeConnection: function() {
//         if (this.aiSocket && this.aiSocket.readyState === WebSocket.OPEN) {
//             this.aiSocket.close();
//             console.log("Connection manually closed");
//         } else {
//             console.log("WebSocket was not open or already closing.");
//         }
//     }
// };

// websocket.initialize();
