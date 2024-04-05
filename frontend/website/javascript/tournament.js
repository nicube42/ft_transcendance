const tournament = {
    tournamentId: null,
    participants: [],
    matches: [],
    maxPlayers: 0,
    currentParticipants: 0,

    init: function() {
        //this.attachEventListeners();
    },

    attachEventListeners: function() {
    },

    handleTournamentCreated: function(data) {
        this.tournamentId = data.tournamentId;
        this.maxPlayers = data.maxPlayers; // Assuming maxPlayers is provided in the message
        ui.showOnlyOneSection('tournamentStage', false, {tournamentId: this.tournamentId});
        console.log('Tournament created with ID:', this.tournamentId);
        // Update participant count initially
        gameSocket.sendMessage({
            action: 'update_participants',
            tournament_id: this.tournamentId
        });
        localStorage.setItem('tournamentId', data.tournamentId);
        localStorage.setItem('maxPlayers', data.maxPlayers);
        localStorage.setItem('participants', JSON.stringify(this.participants));
        localStorage.setItem('currentParticipants', 0);
    },

    updateParticipantCount: function(currentParticipants, maxPlayers, participants) {
        this.currentParticipants = currentParticipants;
        this.maxPlayers = maxPlayers;
        this.participants = Array.isArray(participants) ? participants : [participants];
        document.getElementById('participantCount').textContent = `Participants: ${currentParticipants}/${maxPlayers}`;
        localStorage.setItem('currentParticipants', currentParticipants);
        localStorage.setItem('participants', JSON.stringify(this.participants));
        localStorage.setItem('maxPlayers', maxPlayers);
        if (this.currentParticipants === this.maxPlayers) {
            this.generateMatchTree();
        }
    },

    createTournament: function() {
        const numPlayers = parseInt(document.getElementById('numplayers').value, 10);
        if (isNaN(numPlayers) || numPlayers % 2 !== 0) {
            alert('Please enter a valid even number of players.');
            return;
        }
    
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
    
        // Sending the invitation request to the server
        gameSocket.sendMessage({
            action: 'invite_to_tournament',
            username: usernameInput,
            tournamentId: this.tournamentId
        });
    
        // Adding an event listener for responses to the invitation request
        gameSocket.socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            
            // Checking if the response is related to tournament invitations
            if (data.action === 'tournament_invite_response') {
                if (data.status === 'success') {
                    alert(`Invitation sent to ${usernameInput}`);
                    // Optionally update the UI to show that the player has been invited
                } else if (data.status === 'error') {
                    alert(`Error sending invitation: ${data.message}`);
                }
            }
        });
    },

    showInvitePopup: function(tournamentId, fromUser) {
        const popupDiv = document.createElement('div');
        popupDiv.id = 'invitePopup';
        // Styling for popupDiv...
        
        const message = document.createElement('p');
        message.textContent = `You have been invited to join the tournament by ${fromUser}. Do you accept?`;
        popupDiv.appendChild(message);
        
        const acceptButton = document.createElement('button');
        acceptButton.textContent = 'Accept';
        acceptButton.onclick = () => {
            this.acceptTournamentInvite(tournamentId);
            document.body.removeChild(popupDiv);
        };
        popupDiv.appendChild(acceptButton);
    
        const refuseButton = document.createElement('button');
        refuseButton.textContent = 'Refuse';
        // Styling for refuseButton...
        refuseButton.onclick = () => {
            document.body.removeChild(popupDiv);
        };
        popupDiv.appendChild(refuseButton);
        
        document.body.appendChild(popupDiv);
    },

    acceptTournamentInvite: function(tournamentId) {
        // Send acceptance message back through WebSocket
        gameSocket.sendMessage({
            action: 'accept_tournament_invite',
            tournamentId: tournamentId
        });
        this.tournamentId = tournamentId;
        ui.showOnlyOneSection('tournamentStage', false, {tournamentId: tournamentId});
        gameSocket.sendMessage({
            action: 'update_participants',
            tournament_id: this.tournamentId
        });
    },

    generateMatchTree: function() {
        // Initial setup
        this.matches = []; // Clearing any existing matches
        let round = 1; // Starting with the first round
        let matchId = 1;
        
        let playersInThisRound = [...this.participants]; // Clone the players array
    
        // Generate matches until we have a winner
        while (playersInThisRound.length > 1) {
            let roundMatches = [];
            for (let i = 0; i < playersInThisRound.length; i += 2) {
                // Pair players for a match
                let match = {
                    id: matchId++,
                    round: round,
                    player1: playersInThisRound[i],
                    player2: playersInThisRound[i + 1],
                    winner: null // To be determined
                };
                roundMatches.push(match);
            }
    
            // Prepare for next round
            this.matches.push(...roundMatches);
            playersInThisRound = roundMatches.map(match => match.winner); // Winners of this round
            round++;
        }
    
        this.displayMatchTree();
    },

    displayMatchTree: function() {
        // This method would be responsible for displaying the match tree on the UI
        // It should iterate over `this.matches` and create a visual representation of the match tree
        const tournamentTreeDiv = document.getElementById('tournamentTree');
        tournamentTreeDiv.innerHTML = ''; // Clear the existing tree
    
        this.matches.forEach(match => {
            const matchDiv = document.createElement('div');
            matchDiv.textContent = `Round ${match.round} - Match ${match.id}: ${match.player1} vs ${match.player2}`;
            tournamentTreeDiv.appendChild(matchDiv);
        });
        console.log('Match tree generated and displayed.');
    },

    startFirstRoundMatches: function() {
        // Identify first-round matches
        const firstRoundMatches = this.identifyFirstRoundMatches();
        
        firstRoundMatches.forEach(match => {
            // Use gameSocket to create a room for each match
            gameSocket.init();
            const roomName = `Tournament_${this.tournamentId}_Match_${match.id}`;
            gameSocket.createRoom(roomName);

            // Invite both participants to the room
            gameSocket.sendInvite(match.player1, roomName);
            gameSocket.sendInvite(match.player2, roomName);

            // Start the match after a short delay to ensure both players join
            setTimeout(() => {
                gameSocket.sendGameStart();
            }, 5000); // Adjust delay based on expected join time
        });
    },

    identifyFirstRoundMatches: function() {
        return this.matches.filter(match => match.round === 1);
    },

    // New Method: Process Match Result
    processMatchResult: function(matchId, winner) {
        // Update the match winner in the tournament's state
        const matchIndex = this.matches.findIndex(match => match.id === matchId);
        if (matchIndex > -1) {
            this.matches[matchIndex].winner = winner;

            // Advance winner to the next round or declare tournament winner
            if (this.matches.every(match => match.round === this.matches[matchIndex].round && match.winner)) {
                // If all matches in the current round have concluded
                this.generateNextRoundMatches();
            }
        }
    },

    // New Method: Generate Matches for Next Round
    generateNextRoundMatches: function() {
        if (this.maxPlayers != this.currentParticipants) {
            return;
        }
        // // Check if we are at the final match
        // const remainingPlayers = this.matches.filter(match => !match.winner).length;
        // if (remainingPlayers === 1) {
        //     const tournamentWinner = this.matches.find(match => !match.winner).winner;
        //     this.finalizeTournament(tournamentWinner);
        //     return;
        // }

        // Otherwise, generate next round matches from winners
        let nextRound = Math.max(...this.matches.map(match => match.round)) + 1;
        let matchId = Math.max(...this.matches.map(match => match.id)) + 1;
        let playersInThisRound = this.matches.filter(match => match.winner).map(match => match.winner);
        // Generate and start next round matches
        this.startFirstRoundMatches(); // This now starts the next round matches
    },

    finalizeTournament: function(winner) {
        // Update UI to show the tournament winner and reset tournament state
        alert('Tournament Winner: ' + winner);
        this.resetTournament();
    },

    resetTournament: function() {
        this.tournamentId = null;
        this.players = [];
        this.matches = [];
        // Any additional reset logic
    }
};
