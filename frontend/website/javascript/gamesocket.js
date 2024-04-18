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
        this.socket.addEventListener('close', (event) => {
            console.log("Disconnected from WebSocket, attempting to reconnect...");
            setTimeout(() => this.init(), 5000);
        });

        this.socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            console.log("Received message from server:", data);
        

            if (data.action === 'update_ball_state') {
                if (game.playerRole === 'right') {
                    console.log("Received ball state:", data);
                    game.ballPosX = data.ball_state.ballPosX;
                    game.ballPosY = data.ball_state.ballPosY;
                    game.ballSpeedX = data.ball_state.ballSpeedX;
                    game.ballSpeedY = data.ball_state.ballSpeedY;
                }
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
                        game.rightPaddleMovingUp = data.direction == "up" ? !game.rightPaddleMovingUp : game.rightPaddleMovingUp;
                        game.rightPaddleMovingDown = data.direction == "down" ? !game.rightPaddleMovingDown : game.rightPaddleMovingDown;
                    } else if (game.playerRole === 'right') {
                        game.leftPaddleMovingUp = data.direction === "up" ? !game.leftPaddleMovingUp : game.leftPaddleMovingUp;
                        game.leftPaddleMovingDown = data.direction === "down" ? !game.leftPaddleMovingDown : game.leftPaddleMovingDown;
                    }
                }
            } else if (data.action === 'assign_role') {
                game.playerRole = data.role; // 'left' or 'right'
                console.log(`Assigned role: ${data.role}`);
            } else if (data.error && data.action === 'delete_room') {
                console.error(data.error);
            } else if (data.action === 'receive_invite') {
                console.log(data.message);
                this.showInvitePopup(data.room_name, data.from_user);
            } else if(data.action === 'receive_tournament_invite') {
                tournament.showInvitePopup(data.tournament_id, data.from_user);
            } else if (data.action === 'tournament_created') {
                tournament.handleTournamentCreated(data);
            } else if (data.action === 'update_participant_count') {
                tournament.updateParticipantCount(data.participant_count, data.max_players, data.participants);
            }
        });
    
        this.socket.addEventListener('close', (event) => {
            console.log("Disconnected from WebSocket");
        });
    },

    showInvitePopup: function(roomName, fromUser) {
        const popupDiv = document.createElement('div');
        popupDiv.id = 'invitePopup';
        popupDiv.style.position = 'fixed';
        popupDiv.style.left = '50%';
        popupDiv.style.top = '50%';
        popupDiv.style.transform = 'translate(-50%, -50%)';
        popupDiv.style.backgroundColor = 'white';
        popupDiv.style.padding = '20px';
        popupDiv.style.zIndex = '1000';
        popupDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        
        const message = document.createElement('p');
        message.textContent = `You have been invited to join the room '${roomName}' by ${fromUser}. Do you accept?`;
        popupDiv.appendChild(message);
        
        const acceptButton = document.createElement('button');
        acceptButton.textContent = 'Accept';
        acceptButton.onclick = () => {
            this.joinRoom(roomName);
            document.body.removeChild(popupDiv);
        };
        popupDiv.appendChild(acceptButton);
    
        const refuseButton = document.createElement('button');
        refuseButton.textContent = 'Refuse';
        refuseButton.style.marginLeft = '10px';
        refuseButton.onclick = () => {
            document.body.removeChild(popupDiv);
        };
        popupDiv.appendChild(refuseButton);
        
        document.body.appendChild(popupDiv);
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
        if (!roomListDiv) {
            console.error('Element with ID "roomList" not found.');
            return; // Exit the function if the element is not found
        }
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
        if (this.socket.readyState === WebSocket.OPEN) {
            const message = {
                action: 'update_ball_state',
                ballPosX: game.ballPosX,
                ballPosY: game.ballPosY,
                ballSpeedX: game.ballSpeedX,
                ballSpeedY: game.ballSpeedY,
                room_name: this.currentRoom,
            };
            this.socket.send(JSON.stringify(message));
        } else {
            console.log("WebSocket is not open. Waiting before retrying...");
            setTimeout(() => this.sendBallState(), 1000); // Try again after a delay
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

    sendInvite: function(username, roomName) {
        this.sendMessage({
            action: 'send_invite',
            username: username,
            room_name: roomName,
        });
    },

    createTournament: function() {
        const numPlayers = parseInt(document.getElementById('numplayers').value, 10);
        if (isNaN(numPlayers) || numPlayers % 2 !== 0) {
            alert('Number of players must be an even number.');
            return;
        }
    
        gameSocket.sendMessage({
            action: 'create_tournament',
            numPlayers: numPlayers
        });
    },
    
    invitePlayers: function() {
        const username = document.getElementById('usernameInput').value.trim();
        if (username === '') {
            alert('Please enter a username to invite.');
            return;
        }
    
        gameSocket.sendMessage({
            action: 'invite_to_tournament',
            tournamentId: this.tournamentId,
            username: username
        });
    },
    
    startMatches: function() {
        gameSocket.sendMessage({
            action: 'start_tournament_matches',
            tournamentId: this.tournamentId
        });
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
