var gameSocket = {
    socket: null,
    updateInterval: null,
    ballPosX_tmp: null,
    ballPosY_tmp: null,
    ballSpeedX_tmp: null,
    ballSpeedY_tmp: null,
    currentRoom: null,

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
                        if (data.direction == 'up'){
                            game.rightPaddleMovingUp = data.keyEvent == "pressed" && data.direction == 'up';
                        }
                        else {
                            game.rightPaddleMovingDown = data.keyEvent == "pressed" && data.direction == "down";
                        }
                    } else if (game.playerRole === 'right') {
                        if (data.direction == 'up') {
                            game.leftPaddleMovingUp = data.keyEvent == "pressed" && data.direction == 'up';
                        }
                        else {
                            game.leftPaddleMovingDown = data.keyEvent == "pressed" && data.direction == "down";
                        }
                    }
                }
            } else if (data.action === 'update_paddle_pos'){
                if (game.playerRole !== data.role){
                    data.role === 'left'? game.leftPaddleY = data.leftPaddle : game.rightPaddleY = data.rightPaddle;
                }
            }else if (data.action === 'update_bonus') {
                console.log('game bonuses from right', game.bonusGreen, game.bonusRed);
                console.log(data);
                if (game.playerRole === 'right') {
                    console.log('update_bonus');
                    game.bonusGreen = data.bonusGreen;
                    game.bonusRed = data.bonusRed;
                }
            } else if (data.action === 'assign_role') {
                game.playerRole = data.role; // 'left' or 'right'
                console.log(`Assigned role: ${data.role}`);
            } else if (data.error && data.action === 'delete_room') {
                console.error(data.error);
            } else if (data.action === 'receive_invite') {
                console.log(data.message);
                this.showInvitePopup(data.room_name, data.from_user, 'room');
            } else if(data.action === 'receive_tournament_invite') {
                this.showInvitePopup(data.tournament_id, data.from_user, 'tournament');
            } else if (data.action === 'tournament_created') {
                tournament.handleTournamentCreated(data);
            } else if (data.action === 'update_participant_count') {
                tournament.updateParticipantCount(data.participant_count, data.max_players, data.participants);
            } else if (data.action === 'user_status') {
                const statusIndicator = document.getElementById(`status-${data.username}`);
                console.log(`Updating status for ${data.username} to ${data.status}`);
                if (statusIndicator) {
                    statusIndicator.style.color = data.status === 'online' ? 'green' : 'red';
                }
            } else if (data.action === 'user_in_game') {
                if (data.in_game) {
                    console.log(`${data.username} is in a game.`);
                } else {
                    console.log(`${data.username} is not in a game.`);
                }
            } else if (data.action === 'user_in_game_status') {
                if (data.in_game == false)
                    return ;
                const statusIndicator = document.getElementById(`status-${data.username}`);
                console.log(`Updating status for ${data.username} to ${data.in_game}`);
                if (statusIndicator) {
                    statusIndicator.style.color = 'orange';
                }
            }
        });
    
        this.socket.addEventListener('close', (event) => {
            console.log("Disconnected from WebSocket");
        });
    },

    // showInvitePopup: function(roomName, fromUser) {
    //     const popupDiv = document.createElement('div');
    //     popupDiv.id = 'invitePopup';
    //     popupDiv.style.position = 'fixed';
    //     popupDiv.style.left = '50%';
    //     popupDiv.style.top = '50%';
    //     popupDiv.style.transform = 'translate(-50%, -50%)';
    //     popupDiv.style.backgroundColor = 'white';
    //     popupDiv.style.padding = '20px';
    //     popupDiv.style.zIndex = '1000';
    //     popupDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        
    //     const message = document.createElement('p');
    //     message.textContent = `You have been invited to join the room '${roomName}' by ${fromUser}. Do you accept?`;
    //     popupDiv.appendChild(message);
        
    //     const acceptButton = document.createElement('button');
    //     acceptButton.textContent = 'Accept';
    //     acceptButton.onclick = () => {
    //         this.joinRoom(roomName);
    //         document.body.removeChild(popupDiv);
    //     };
    //     popupDiv.appendChild(acceptButton);
    
    //     const refuseButton = document.createElement('button');
    //     refuseButton.textContent = 'Refuse';
    //     refuseButton.style.marginLeft = '10px';
    //     refuseButton.onclick = () => {
    //         document.body.removeChild(popupDiv);
    //     };
    //     popupDiv.appendChild(refuseButton);
        
    //     document.body.appendChild(popupDiv);
    // },

    showInvitePopup: function(inviteId, fromUser, inviteType) {
        const inviteModal = new bootstrap.Modal(document.getElementById('invitePopupModal'));
        const inviteMessage = document.getElementById('inviteMessage');
        const acceptButton = document.getElementById('acceptInvite');
        const refuseButton = document.getElementById('refuseInvite');
    
        // Set the invitation message based on the type
        if (inviteType === 'tournament') {
            inviteMessage.textContent = `You have been invited to join the tournament by ${fromUser}. Do you accept?`;
            acceptButton.onclick = () => {
                tournament.acceptTournamentInvite(inviteId);
                inviteModal.hide();
            };
        } else if (inviteType === 'room') {
            inviteMessage.textContent = `You have been invited to join the room '${inviteId}' by ${fromUser}. Do you accept?`;
            acceptButton.onclick = () => {
                this.joinRoom(inviteId);
                inviteModal.hide();
            };
        }
    
        refuseButton.onclick = () => {
            inviteModal.hide();
        };
    
        // Show the modal
        inviteModal.show();
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
        ui.showOnlyOneSection('multiplayer');
    },

    listRooms: function() {
        this.sendMessage({'action': 'list_rooms'});
    },

    listUsersInRoom: function(roomName) {
        this.sendMessage({'action': 'list_users_in_room', 'room_name': roomName});
    },    

    updateRoomList: function(rooms) {

        if (!rooms){
            return ;
        }
        const roomListDiv = document.getElementById('roomList');
        if (!roomListDiv) {
            console.error('Element with ID "roomList" not found.');
            return;
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
    sendBonusState: function (bonusGreen, bonusRed) {
        this.sendMessage({
            'action': 'update_bonus',
            'room_name': this.currentRoom,
            'bonusGreen': bonusGreen,
            'bonusRed': bonusRed,
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
            setTimeout(() => this.sendBallState(), 1000);
        }
    },   
    sendPaddlePos: function(role, leftPaddleY, rightPaddleY) {
        this.sendMessage({
            'action': 'update_paddle_pos',
            'role': role,
            'leftPaddle': leftPaddleY,
            'rightPaddle': rightPaddleY,
            'room': this.currentRoom,
        });
    },
    
    sendPaddleMovement: function(direction, keyEvent) {
        if (this.socket.readyState === WebSocket.OPEN) {
            const message = {
                action: 'paddle_move',
                direction: direction,
                role: game.playerRole,
                room_name: this.currentRoom,
                keyEvent: keyEvent,
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

    sendGameStart2: function(roomName) {
        this.sendMessage({
            action: 'start_game',
            room_name: roomName,
        });
    },
    
    sendMessage: function(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.log("WebSocket is not open. Retrying to send message...");
            this.waitForSocketReady(() => {
                this.socket.send(JSON.stringify(message));
            });
        }
    },

    waitForSocketReady: function(callback, attempts = 5) {
        const interval = 1000;
        let attemptsLeft = attempts;
    
        const checkSocket = () => {
            if (!this.socket) {
                console.error("WebSocket has not been initialized.");
                return;
            }
    
            if (this.socket.readyState === WebSocket.OPEN) {
                console.log("WebSocket is now open.");
                callback();
            } else {
                if (attemptsLeft <= 0) {
                    console.error("Failed to send message: WebSocket is not open and max attempts reached.");
                } else {
                    attemptsLeft--;
                    console.log("Waiting for WebSocket to be open...", attemptsLeft, "attempts left.");
                    setTimeout(checkSocket, interval);
                }
            }
        };
    
        checkSocket();
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
    c
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

    sendUserStatusRequest: function(username) {
        const message = {
            action: 'send_user_status',
            username: username
        };

        this.sendMessage(message);
    },

    checkIfUserInGame: function(username) {
        const message = {
            action: 'check_user_in_game',
            username: username
        };

        this.sendMessage(message);
    }
};

window.addEventListener('beforeunload', function() {
    if (gameSocket.leaveInterval) {
        clearInterval(gameSocket.leaveInterval);
    }
});