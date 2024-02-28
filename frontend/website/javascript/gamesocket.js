var gameSocket = {
    socket: null,
    updateInterval: null,
    ballPosX_tmp: null,
    ballPosY_tmp: null,
    ballSpeedX_tmp: null,
    ballSpeedY_tmp: null,

    init: function() {
        // Dynamically determine the WebSocket scheme based on the current location protocol
        const wsScheme = window.location.protocol === "https:" ? "wss://" : "ws://";
        // Use window.location.host to automatically adapt to the current domain and port
        const backendHost = window.location.host; // Adjust if your backend is on a different port or subdomain
        // Combine to form the WebSocket URL
        this.socket = new WebSocket(`${wsScheme}${backendHost}/ws/game/`);
        this.socket.addEventListener('open', (event) => {
            console.log("Connected to WebSocket");
            this.listRooms(); // Now it's safe to send messages
        });
    
        this.socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            console.log("Received message from server:", data);
        

            if (data.action === 'update_ball_state') {
                console.log("Received ball state:", data);
                game.ballPosX = data.ball_state.ballPosX;
                game.ballPosY = data.ball_state.ballPosY;
                game.ballSpeedX = data.ball_state.ballSpeedX;
                game.ballSpeedY = data.ball_state.ballSpeedY;
            }

            if (data.action === 'list_users') { // Make sure this matches the backend action type
                console.log("List of users in room:", data.users); // Debugging to see if we're getting here
                this.updateUserList(data.users, data.room_name); // Update the user list in the UI
            } else if (data.action === 'list_rooms') {
                this.updateRoomList(data.rooms);
            } else if (data.action === 'start_game') {
                // Code to initialize the game goes here
                console.log("Game is starting!");
                this.stopPeriodicUpdates();
                game.setGameMode('distant');
                ui.showOnlyOneSection('play');
            } else if(data.action === 'paddle_move') {
                // Apply the movement based on the received direction and role
                let paddleAdjustment = data.direction === 'up' ? -game.paddleSpeed : game.paddleSpeed;
        
                // Check the role received in the message and adjust the opposite paddle
                if(data.role === game.playerRole) {
                    // If the role matches the local player's role, don't move any paddle
                    // Because it means the local player has initiated the move and it's already been handled locally
                } else {
                    // If the role doesn't match, it's an opponent's move, so move the corresponding paddle
                    if (game.playerRole === 'left') {
                        // Local player is 'left', so move the right paddle for opponent's move
                        game.rightPaddleY += paddleAdjustment;
                        game.rightPaddleY = Math.max(Math.min(game.rightPaddleY, game.canvas.height - game.paddleHeight), 0);
                    } else if (game.playerRole === 'right') {
                        // Local player is 'right', so move the left paddle for opponent's move
                        game.leftPaddleY += paddleAdjustment;
                        game.leftPaddleY = Math.max(Math.min(game.leftPaddleY, game.canvas.height - game.paddleHeight), 0);
                    }
                }
            } else if (data.action === 'assign_role') {
                game.playerRole = data.role; // 'left' or 'right'
                console.log(`Assigned role: ${data.role}`);
            }
            
        });
    
        this.socket.addEventListener('close', (event) => {
            console.log("Disconnected from WebSocket");
        });
    },   

    closeAndReinitialize: function() {
        if (this.socket) {
            this.socket.close();
        }
        this.init();
    },

    getSessionId: function() {
        const cookieName = "sessionid="; // Change 'sessionid' to the name of your session cookie or token
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(cookieName) === 0) {
                return c.substring(cookieName.length, c.length);
            }
        }
        return ""; // Return empty string or null if the session ID/token is not found
    },

    // Send a message to create a room
    createRoom: function(roomName) {
        this.sendMessage({'action': 'create_room', 'room_name': roomName});
    },

    // Send a message to join a room
    joinRoom: function(roomName) {
        this.sendMessage({'action': 'join_room', 'room_name': roomName});
        this.currentRoom = roomName;
        this.startPeriodicUpdates();
        ui.showOnlyOneSection('rooms')
    },

    checkAndLeaveRoom: function() {
        if (!ui.isSectionVisible('rooms')) {
            this.leaveRoom(this.currentRoom);
        }
    },

    // Leave a room
    leaveRoom: function(roomName) {
        this.sendMessage({'action': 'leaveRoom', 'room_name': roomName});
        this.stopPeriodicUpdates();
    },

    listRooms: function() {
        this.sendMessage({'action': 'list_rooms'});
    },

    listUsersInRoom: function(roomName) {
        this.sendMessage({'action': 'list_users_in_room', 'room_name': roomName});
    },    

    updateRoomList: function(rooms) {
        const roomListDiv = document.getElementById('roomList');
        roomListDiv.innerHTML = ''; // Clear current list
        if (ui.isSectionVisible('multiplayer')) {        
            rooms.forEach((room) => { // Assuming room is an object with a property 'name'
                const roomElement = document.createElement('div');
                roomElement.className = 'room-item';
                roomElement.textContent = room.name; // Access the 'name' property of the room object
                roomElement.style.color = 'white';
                roomElement.addEventListener('click', () => {
                    this.joinRoom(room.name); // Make sure to pass the room's name here as well
                });
        
                roomListDiv.appendChild(roomElement);
            });
        }
    },

    updateUserList: function(users, roomName) {
        const usersListDiv = document.getElementById('roomUsersList');
        if (!usersListDiv) {
            console.error('Element with ID "roomUsersList" not found.');
            return;
        }
        usersListDiv.innerHTML = ''; // Clear current list
        console.log('Updating user list for room:', roomName, 'with users:', users);
        
        // Assuming 'users' is an array of strings (usernames)
        users.forEach((username) => {
            const userElement = document.createElement('a');
            userElement.href = "#";
            userElement.className = 'list-group-item list-group-item-action';
            userElement.textContent = username; // Use the username directly
            usersListDiv.appendChild(userElement);
        });
    
        // Update the heading to show the room name
        const roomNameHeading = document.getElementById('roomNameHeading');
        if (roomNameHeading) {
            roomNameHeading.textContent = `Users in ${roomName}:`;
        } else {
            console.error('Element with ID "roomNameHeading" not found.');
        }
    },

    joinDistantRoom: function(roomName) {
        this.currentRoom = roomName;
        this.sendMessage({
            action: 'join_room',
            room_name: roomName,
            mode: 'distant' // Specify the game mode as distant multiplayer
        });
    },

    sendBallState: function() {
        if (game.playerRole === 'left' && game.ballPosX !== null && game.ballPosY !== null && game.ballSpeedX !== null && game.ballSpeedY !== null) {
            const message = {
            action: 'update_ball_state',
            ballPosX: game.ballPosX,
            ballPosY: game.ballPosY,
            ballSpeedX: game.ballSpeedX,
            ballSpeedY: game.ballSpeedY,
            room_name: this.currentRoom,
            };
            this.socket.send(JSON.stringify(message));
        }
      },
    
    sendPaddleMovement: function(direction) {
        if (this.socket.readyState === WebSocket.OPEN) {
            const message = {
                action: 'paddle_move',
                direction: direction, // 'up' or 'down'
                role: game.playerRole, // Include the player's role here
                room_name: this.currentRoom,
            };
            this.socket.send(JSON.stringify(message));
        }
    },


    sendGameStart: function() {
        this.sendMessage({
            action: 'start_game',
            room_name: this.currentRoom,
        });
    },
    
    sendMessage: function(message) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.log("WebSocket is not open. Waiting before retrying...");
            setTimeout(() => this.sendMessage(message), 1000); // Recursive retry with delay
        }
    },

    startPeriodicUpdates: function() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval); // Clear any existing interval to avoid duplicates
        }
        this.updateInterval = setInterval(() => {
            if (this.currentRoom) {
                this.listUsersInRoom(this.currentRoom);
            } else {
                this.stopPeriodicUpdates(); // Stop updates if there's no current room
            }
        }, 2000); // Update every 2 seconds
    },

    stopPeriodicUpdates: function() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    },
    
};

window.addEventListener('beforeunload', function() {
    if (gameSocket.leaveInterval) {
        clearInterval(gameSocket.leaveInterval);
    }
});

// Once the page is fully loaded, initialize the WebSocket connection
window.addEventListener('load', function() {
    gameSocket.init();
});
