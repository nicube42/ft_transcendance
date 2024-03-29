var gameSocket = {
    socket: null,
    updateInterval: null,
    ballPosX_tmp: null,
    ballPosY_tmp: null,
    ballSpeedX_tmp: null,
    ballSpeedY_tmp: null,

    init: function() {
        const wsScheme = window.location.protocol === "https:" ? "wss://" : "ws://";
        const backendHost = window.location.host;
        this.socket = new WebSocket(`${wsScheme}${backendHost}/ws/game/`);
        this.socket.addEventListener('open', (event) => {
            console.log("Connected to WebSocket");
            this.listRooms();
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

            if (data.action === 'list_users') { 
                console.log("List of users in room:", data.users);
                this.updateUserList(data.users, data.room_name);
            } else if (data.action === 'list_rooms') {
                this.updateRoomList(data.rooms);
            } else if (data.action === 'start_game') {
                console.log("Game is starting!");
                this.stopPeriodicUpdates();
                game.setGameMode('distant');
                ui.showOnlyOneSection('play');
            } else if(data.action === 'paddle_move') {
                let paddleAdjustment = data.direction === 'up' ? -game.paddleSpeed : game.paddleSpeed;
                if(data.role === game.playerRole) {
                } else {
                    if (game.playerRole === 'left') {
                        game.rightPaddleY += paddleAdjustment;
                        game.rightPaddleY = Math.max(Math.min(game.rightPaddleY, game.canvas.height - game.paddleHeight), 0);
                    } else if (game.playerRole === 'right') {
                        game.leftPaddleY += paddleAdjustment;
                        game.leftPaddleY = Math.max(Math.min(game.leftPaddleY, game.canvas.height - game.paddleHeight), 0);
                    }
                }
            } else if (data.action === 'assign_role') {
                game.playerRole = data.role; // 'left' or 'right'
                console.log(`Assigned role: ${data.role}`);
            } else if (data.error && data.action === 'delete_room') {
                console.error(data.error);
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
        const cookieName = "sessionid=";
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
        return "";
    },

    createRoom: function(roomName) {
        this.sendMessage({'action': 'create_room', 'room_name': roomName});
    },

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

    leaveRoom: function(roomName) {
        this.sendMessage({'action': 'leaveRoom', 'room_name': roomName});
        this.stopPeriodicUpdates();
    },

    deleteRoom: function(roomName) {
        this.sendMessage({'action': 'delete_room', 'room_name': roomName});
    },

    listRooms: function() {
        this.sendMessage({'action': 'list_rooms'});
    },

    listUsersInRoom: function(roomName) {
        this.sendMessage({'action': 'list_users_in_room', 'room_name': roomName});
    },    

    updateRoomList: function(rooms) {
        const roomListDiv = document.getElementById('roomList');
        roomListDiv.innerHTML = '';
    
        rooms.forEach((room) => {
            const roomElement = document.createElement('div');
            roomElement.className = 'room-item';
            roomElement.style.display = 'flex';
            roomElement.style.justifyContent = 'space-between';
            roomElement.style.alignItems = 'center';
    
            const roomName = document.createElement('span');
            roomName.textContent = room.name;
            roomName.style.color = 'white';
            roomElement.appendChild(roomName);
    
            if (room.is_admin) {
                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.className = 'btn-close btn-close-white';
                deleteButton.setAttribute('aria-label', 'Close');
                deleteButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.deleteRoom(room.name);
                });
                roomElement.appendChild(deleteButton);
            }
    
            roomElement.addEventListener('click', () => {
                this.joinRoom(room.name);
            });
    
            roomListDiv.appendChild(roomElement);
        });
    },    

    updateUserList: function(users, roomName) {
        const usersListDiv = document.getElementById('roomUsersList');
        if (!usersListDiv) {
            console.error('Element with ID "roomUsersList" not found.');
            return;
        }
        usersListDiv.innerHTML = '';
        console.log('Updating user list for room:', roomName, 'with users:', users);
        
        users.forEach((username) => {
            const userElement = document.createElement('a');
            userElement.href = "#";
            userElement.className = 'list-group-item list-group-item-action text-success text-center fs-2';
            userElement.textContent = username;
            usersListDiv.appendChild(userElement);
        });
    
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
            mode: 'distant'
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
                direction: direction,
                role: game.playerRole,
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
            setTimeout(() => this.sendMessage(message), 1000);
        }
    },

    startPeriodicUpdates: function() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.updateInterval = setInterval(() => {
            if (this.currentRoom) {
                this.listUsersInRoom(this.currentRoom);
            } else {
                this.stopPeriodicUpdates();
            }
        }, 2000);
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
