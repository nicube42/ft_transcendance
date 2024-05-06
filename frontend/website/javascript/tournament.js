const tournament = {
    tournamentId: null,
    initialNumPlayers: 0,
    participants: [],
    last_round_participants: [],
    matches: [],
    maxPlayers: 0,
    currentParticipants: 0,
    currentRound: 0,
    matchId: 1,
    matchTreeGenerated: false,

    handleTournamentCreated: function(data) {
        this.tournamentId = data.tournamentId;
        this.maxPlayers = data.maxPlayers;
        ui.showOnlyOneSection('tournamentStage', false, {tournamentId: this.tournamentId});
        gameSocket.sendMessage({
            action: 'update_participants',
            tournament_id: this.tournamentId
        });
        localStorage.setItem('tournamentId', data.tournamentId);
        localStorage.setItem('maxPlayers', data.maxPlayers);
        localStorage.setItem('participants', JSON.stringify(this.participants));
        localStorage.setItem('currentParticipants', 0);
        this.currentRound = 1;
        localStorage.setItem('currentRound', this.currentRound);
    },

    updateParticipantCount: function(currentParticipants, maxPlayers, participants) {
        this.currentParticipants = currentParticipants;
        this.maxPlayers = maxPlayers;
        this.participants = Array.isArray(participants) ? participants : [participants];
        document.getElementById('participantCount').textContent = `Participants: ${currentParticipants}/${maxPlayers}`;
        localStorage.setItem('currentParticipants', currentParticipants);
        localStorage.setItem('participants', JSON.stringify(this.participants));
        localStorage.setItem('maxPlayers', maxPlayers);
        this.checkIfEndOfTournament();
        if (this.currentParticipants === this.maxPlayers && this.participants.length % 2 === 0 && this.currentRound === 1 && this.matchTreeGenerated === false) {
            this.matchTreeGenerated = true;
            this.generateMatchTree();
        }
    },

    createTournament: function() {
        const numPlayers = parseInt(document.getElementById('numplayers').value, 10);
        if (isNaN(numPlayers) || numPlayers % 2 !== 0) {
            alert('Please enter a valid even number of players.');
            return;
        }
        this.initialNumPlayers = numPlayers;
        localStorage.setItem('initialNumPlayers', this.initialNumPlayers);
        auth.updateUserTournamentStatus('true');
    
        gameSocket.sendMessage({
            action: 'create_tournament',
            numPlayers: numPlayers
        });
    },
    
    invitePlayers: function() {
        const usernameInput = document.getElementById('inviteUsername').value.trim();
        if (usernameInput === '') {
            alert('Please enter a username to invite.');
            return;
        }
        auth.retrieveInfos().then(userInfo => {
            const username = userInfo.username;
            if (usernameInput === username) {
                alert('You cannot add yourself to the tournament');
                return;
            }
            else
            {
                gameSocket.sendMessage({
                    action: 'invite_to_tournament',
                    username: usernameInput,
                    tournamentId: this.tournamentId
                });
            
                gameSocket.socket.addEventListener('message', (event) => {
                    const data = JSON.parse(event.data);
                    
                    if (data.action === 'tournament_invite_response') {
                        if (data.status === 'success') {
                            alert(`Invitation sent to ${usernameInput}`);
                        } else if (data.status === 'error') {
                            alert(`Error sending invitation: ${data.message}`);
                        }
                    }
                });
            }
        });
    },

    // showInvitePopup: function(tournamentId, fromUser) {
    //     const popupDiv = document.createElement('div');
    //     popupDiv.id = 'invitePopup';
        
    //     const message = document.createElement('p');
    //     message.textContent = `You have been invited to join the tournament by ${fromUser}. Do you accept?`;
    //     popupDiv.appendChild(message);
        
    //     const acceptButton = document.createElement('button');
    //     acceptButton.textContent = 'Accept';
    //     acceptButton.onclick = () => {
    //         this.acceptTournamentInvite(tournamentId);
    //         document.body.removeChild(popupDiv);
    //     };
    //     popupDiv.appendChild(acceptButton);
    
    //     const refuseButton = document.createElement('button');
    //     refuseButton.textContent = 'Refuse';
    //     refuseButton.onclick = () => {
    //         document.body.removeChild(popupDiv);
    //     };
    //     popupDiv.appendChild(refuseButton);
        
    //     document.body.appendChild(popupDiv);
    // }, 

    acceptTournamentInvite: function(tournamentId) {
        gameSocket.sendMessage({
            action: 'accept_tournament_invite',
            tournamentId: tournamentId
        });
        this.tournamentId = tournamentId;
        ui.showOnlyOneSection('tournamentStage', false, {tournamentId: tournamentId});
        localStorage.setItem('tournamentId', this.tournamentId);
        localStorage.setItem('maxPlayers', this.maxPlayers);
        localStorage.setItem('participants', JSON.stringify(this.participants));
        localStorage.setItem('currentParticipants', this.currentParticipants);
        this.currentRound = 1;
        localStorage.setItem('currentRound', this.currentRound);
        auth.updateUserTournamentStatus('true');
        gameSocket.sendMessage({
            action: 'update_participants',
            tournament_id: this.tournamentId
        });
    },

    generateMatchTree: function() {
    
        const proceedWithMatchGeneration = () => {
            let round = this.currentRound;
            let matchId = this.matches.reduce((maxId, match) => Math.max(maxId, match.id), 0) + 1;
            let playersInThisRound = [...this.participants];
            
            if (playersInThisRound.length < 2) {
                return;
            }
    
            if (round > 1) {
                this.matches = this.matches.filter(match => match.round < round);
            }
    
            let roundMatches = [];
            for (let i = 0; i < playersInThisRound.length; i += 2) {
                if (playersInThisRound[i + 1] !== undefined) {
                    let match = {
                        id: matchId++,
                        round: round,
                        player1: playersInThisRound[i],
                        player2: playersInThisRound[i + 1],
                        winner: null
                    };
                    roundMatches.push(match);
                }
            }
    
            this.matches.push(...roundMatches);
            this.displayMatchTree();
        };
    
        const checkParticipants = () => {
            if (this.participants.length > this.last_round_participants / 2 && this.round > 1) {
                setTimeout(checkParticipants, 5000);
            } else if (this.participants.length % 2 === 0){
                proceedWithMatchGeneration();
            } else {
                setTimeout(checkParticipants, 5000);
            }
        };
    
        checkParticipants();
    },

    displayMatchTree: function() {
        const tournamentTreeDiv = document.getElementById('tournamentTree');
        tournamentTreeDiv.innerHTML = '';
    
        this.matches.forEach(match => {
            const matchDiv = document.createElement('div');
            matchDiv.textContent = `Round ${match.round} - Match ${match.id}: ${match.player1} vs ${match.player2}`;
            tournamentTreeDiv.appendChild(matchDiv);
        });
        localStorage.setItem('tournamentId', this.tournamentId);
        localStorage.setItem('maxPlayers', this.maxPlayers);
        localStorage.setItem('participants', JSON.stringify(this.participants));
        localStorage.setItem('currentParticipants', this.currentParticipants);
    },

    startFirstRoundMatches: function() {
        const firstRoundMatches = this.identifyFirstRoundMatches();
        
        firstRoundMatches.forEach(match => {
            gameSocket.init();
            const roomName = `Tournament_${this.tournamentId}_Match_${match.id}`;
            gameSocket.createRoom(roomName);

            gameSocket.sendInvite(match.player1, roomName);
            gameSocket.sendInvite(match.player2, roomName);
            
            this.last_round_participants = this.participants;
            localStorage.setItem('last_round_participants', JSON.stringify(this.last_round_participants));
            setTimeout(() => {
                gameSocket.sendGameStart2(roomName);
            }, 10000);
        });
    },

    startNextRoundMatches: function(currentRound, maxPlayers) {
        if (this.maxPlayers !== maxPlayers) {
            console.error('Player count mismatch. Unable to start matches for the next round.');
            return;
        }
    
        let nextRound = currentRound;
        let nextRoundMatches = this.matches.filter(match => match.round === nextRound && !match.winner);
    
        if (nextRoundMatches.length === 0) {
            return;
        }
    
    
        nextRoundMatches.forEach(match => {
            gameSocket.init();
    
            const roomName = `Tournament_${this.tournamentId}_Match_${match.id}`;
            gameSocket.createRoom(roomName);

            gameSocket.sendInvite(match.player1, roomName);
            if (match.player2) {
                gameSocket.sendInvite(match.player2, roomName);
            }
    
            setTimeout(() => {
                gameSocket.sendGameStart2(roomName);
            }, 10000);
        });
    },    

    identifyFirstRoundMatches: function() {
        return this.matches.filter(match => match.round === 1);
    },

    generateNextRoundMatches: function() {
        if (this.maxPlayers != this.currentParticipants) {
            return;
        }

        let nextRound = Math.max(...this.matches.map(match => match.round)) + 1;
        let matchId = Math.max(...this.matches.map(match => match.id)) + 1;
        let playersInThisRound = this.matches.filter(match => match.winner).map(match => match.winner);
        if (this.currentRound === 1) {
            this.startFirstRoundMatches();
        }
        else
        {
            this.startNextRoundMatches(this.currentRound, this.maxPlayers);
        }
    },

    checkIfEndOfTournament: function() {
        auth.retrieveInfos().then(userInfo => {
            const username = userInfo.username;
            if (this.maxPlayers === 1 && this.participants[0] === username) {
                auth.retrieveInfos().then(userInfo => {
                    this.finalizeTournament(userInfo.username);
                    auth.updateUserTournamentStatus('false');
                });
                return;
            }
        });
    },

    finalizeTournament: function(winner) {
        alert('Tournament Winner: ' + winner);
        this.resetTournament();
    },

    resetTournament: function() {
        this.tournamentId = null;
        this.players = [];
        this.matches = [];
    },

    checkUserInTournament: function() {
        return fetch('/api/check_user_in_tournament/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Failed to check tournament status');
            }
        })
        .then(data => {
            return data.is_in_tournament;
        })
        .catch(error => {
            console.error('Error checking tournament status:', error);
            return false;
        });
    },

    navigateToTournamentStage: function() {
        if (!this.tournamentId) {
            console.error('No tournament ID is set in the tournament object');
            return;
        }
    
        const url = new URL(window.location);
        url.pathname = '/tournamentStage';
        url.searchParams.set('tournamentId', this.tournamentId);
        history.pushState({ path: url.toString() }, '', url.toString());
    
        ui.showOnlyOneSection('tournamentStage', false, { tournamentId: this.tournamentId });
    },

    deleteUserFromTournament: function(username) {
        ui.loadTournamentData();
        const index = this.participants.indexOf(username);
        if (index === -1) {
            console.error('User not found in the tournament');
            return;
        }
    
        this.participants.splice(index, 1);
    
        this.currentParticipants--;
    
        this.maxPlayers--;
    
        document.getElementById('participantCount').textContent = `Participants: ${this.currentParticipants}/${this.maxPlayers}`;
    
        localStorage.setItem('participants', JSON.stringify(this.participants));
        localStorage.setItem('currentParticipants', this.currentParticipants);

        this.updateParticipantCount(this.currentParticipants, this.maxPlayers, this.participants);

        gameSocket.sendMessage({
            action: 'delete_participant_from_tournament',
            tournament_id: this.tournamentId,
            username: username
        });

        gameSocket.sendMessage({
            action: 'update_tournament_participants',
            tournament_id: this.tournamentId,
            participants: this.participants,
            currentParticipants: this.currentParticipants,
            maxPlayers: this.maxPlayers
        });

        alert(`You lost the tournament`);
    },
};
