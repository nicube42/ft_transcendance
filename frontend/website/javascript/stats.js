const stats = {
    startTime: null,
    endTime: null,
    totalBallsServed: 0,

    initStats: function() {
        this.startTime = new Date();
        this.totalBallsServed = 0;
        this.endTime = null;
    },

    updateGameRestart: function() {
        this.totalBallsServed++;
    },

    recordEndTime: function() {
        this.endTime = new Date();
    },

    calculateGameDuration: function() {
        if (!this.startTime || !this.endTime) {
            return 0;
        }
        return (this.endTime - this.startTime) / 1000;
    },

    displayEndGameStats: function() {
        const duration = this.calculateGameDuration();
        const totalBalls = this.totalBallsServed;
        const player1Score = game.player1Score;
        const player2Score = game.player2Score;
        const winner = player1Score > player2Score ? game.settings.player1Name : game.settings.player2Name;
        var username = '';
    
        document.getElementById('player1_endgame').textContent = player1Score;
        document.getElementById('player2_endgame').textContent = player2Score;
        document.getElementById('winner_endgame').textContent = winner;
        document.getElementById('gameDuration').textContent = `Duration: ${duration.toFixed(2)} seconds`;
        document.getElementById('totalBalls').textContent = `Total balls served: ${totalBalls}`;
        if (this.endTime === null) {
            this.recordEndTime();
        }
        auth.retrieveInfos().then(userInfo => {
            username = userInfo.username;
            if (userInfo && userInfo.username) {
                var postData = {
                    player1: userInfo.username,
                    player2: game.settings.player2Name,
                    player1_score: player1Score,
                    player2_score: player2Score,
                    start_time: stats.startTime.toISOString(),
                    end_time: stats.endTime.toISOString()
                };
                if (game.gameMode === 'distant')
                {
                    if (game.playerRole === 'right')
                    {
                        postData = {
                            player1: userInfo.username,
                            player2: game.settings.player1Name,
                            player1_score: player2Score,
                            player2_score: player1Score,
                            start_time: stats.startTime.toISOString(),
                            end_time: stats.endTime.toISOString()
                        };
                    }
                }
                fetch('/api/game_record/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify(postData)
                })
                .then(response => response.json())
                .then(data => console.log('Game data saved:', data))
                .catch(error => console.error('Failed to save game data:', error));
            } else {
                console.error('Failed to retrieve user info or username missing');
            }
        }).catch(error => {
            console.error('Error in retrieving user info:', error);
        });
        console.log('Went here \n\n\n\n\n\n\n\n');
        tournament.checkUserInTournament().then(isInTournament => {
            const returnHomeButton = document.getElementById('returnHome');
            const playAgainButton = document.getElementById('playAgain');
            console.log('Tournament status (inside then):', isInTournament);
    
            if (isInTournament) {
                if (game.playerRole === 'right')
                {
                    if (player1Score > player2Score)
                    {
                        tournament.deleteUserFromTournament(username);
                        auth.updateUserTournamentStatus('false');
                        ui.showOnlyOneSection('homepage');
                        return;
                    }
                }
                else
                {
                    if (player1Score < player2Score)
                    {
                        tournament.deleteUserFromTournament(username);
                        auth.updateUserTournamentStatus('false');
                        ui.showOnlyOneSection('homepage');
                        return;
                    }
                }
                tournament.currentRound += 1;
                localStorage.setItem('currentRound', this.currentRound);
                console.log('Current round:', tournament.currentRound);
                tournament.navigateToTournamentStage();
                setTimeout(() => {
                    tournament.generateMatchTree();
                },10000);
            } else {
                playAgainButton.textContent = 'Play Again';
                playAgainButton.onclick = this.playAgain;
    
                returnHomeButton.textContent = 'Return to Home';
                returnHomeButton.onclick = this.returnToHome;
                ui.showOnlyOneSection('endgameStats');
            }
        }).catch(error => {
            console.error('Error checking tournament status:', error);
        });
    },
        
    returnToHome: function() {
        ui.showOnlyOneSection('homepage');
    }
};

