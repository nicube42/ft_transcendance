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
        this.endTime = null;
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
        if (player1Score > player2Score) {
            winner = 1;
        }
        else {
            winner = 2;
        }
        document.getElementById('gameDuration').textContent = `Duration: ${duration.toFixed(2)} seconds`;
        document.getElementById('totalBalls').textContent = `Total balls served: ${totalBalls}`;
        ret = this.fetchGameResultDetails(game, winner);
        if (ret === 1)
            return;
        setTimeout(() => {
            if (this.endTime === null) {
                this.recordEndTime();
            }
            auth.retrieveInfos().then(userInfo => {
                username = userInfo.username;
                var opponent;
                auth.get_opponent_name().then(opponentName => {
                    opponent = opponentName.other_player;
                    if (userInfo && userInfo.username) {
                        var postData = {
                            player1: userInfo.username,
                            player2: "opponent",
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
                                    player2: opponent,
                                    player1_score: player2Score,
                                    player2_score: player1Score,
                                    start_time: stats.startTime.toISOString(),
                                    end_time: stats.endTime.toISOString()
                                };
                            }
                            else{
                                postData = {
                                    player1: userInfo.username,
                                    player2: opponent,
                                    player1_score: player1Score,
                                    player2_score: player2Score,
                                    start_time: stats.startTime.toISOString(),
                                    end_time: stats.endTime.toISOString()
                                };
                            }
                        }
                        if (postData.player1 && postData.player2 && postData.start_time && postData.end_time) {
                            fetch('/api/game_record/', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRFToken': getCookie('csrftoken')
                                },
                                body: JSON.stringify(postData)
                            })
                            .then(response => response.json())
                            .then(data => {})
                            .catch(error => {});
                        }
                        else
                            return;
                    } else {
                    }
                });
            }).catch(error => {
            });
            tournament.checkUserInTournament().then(isInTournament => {
                const returnHomeButton = document.getElementById('returnHome');
                const playAgainButton = document.getElementById('playAgain');
        
                if (isInTournament) {
                    game.isPlaying = false;
                    auth.retrieveInfos().then(userInfo => {
                        if (game.playerRole === 'right')
                        {
                            if (player1Score > player2Score)
                            {
                                tournament.deleteUserFromTournament(userInfo.username);
                                auth.updateUserTournamentStatus('false');
                                ui.showOnlyOneSection('homepage');
                                gameSocket.leaveRoom(gameSocket.currentRoom);
                                gameSocket.deleteRoom(gameSocket.currentRoom);
                                return;
                            }
                        }
                        else
                        {
                            if (player1Score < player2Score)
                            {
                                tournament.deleteUserFromTournament(userInfo.username);
                                auth.updateUserTournamentStatus('false');
                                ui.showOnlyOneSection('homepage');
                                gameSocket.leaveRoom(gameSocket.currentRoom);
                                gameSocket.deleteRoom(gameSocket.currentRoom);
                                return;
                            }
                        }
                        gameSocket.leaveRoom(gameSocket.currentRoom);
                        gameSocket.deleteRoom(gameSocket.currentRoom);
                        tournament.currentRound += 1;
                        localStorage.setItem('currentRound', this.currentRound);
                        tournament.navigateToTournamentStage();
                        setTimeout(() => {
                            tournament.generateMatchTree();
                        },2000);
                    });
                } else {
                    if (game.gameMode !== 'distant') {
                        document.getElementById('playAgain').classList.remove('d-none');
                        playAgainButton.textContent = 'Play Again';
                        playAgainButton.onclick = this.playAgain;
                    }
                    else
                    {
                        document.getElementById('playAgain').classList.add('d-none');
                    }
        
                    returnHomeButton.textContent = 'Return to Home';
                    returnHomeButton.onclick = this.returnToHome;
                    ui.showOnlyOneSection('endgameStats');
                }
                if (game.gameMode === 'distant') {
                    fetch('/api/check-if-user-in-any-room/')
                        .then(response => {
                            if (response.ok) {
                                return response.json();
                            } else {
                                return response.text().then(text => { throw new Error(text || 'Problem checking room status'); });
                            }
                        })
                        .then(data => {
                            if (data.status === 'User is in a room') {
                                gameSocket.deleteRoom(data.rooms[0]);
                            }
                        })
                        .catch(error => {
                            ui.showGenericErrorModal('There was an error checking your room status. Please try again.');
                        });
                }
                game.gameMode = 'multiplayer';
            }).catch(error => {
            });
        }, 1000);
    },

    fetchGameResultDetails: async function(game, winner) {
        const userInfo = await auth.retrieveInfos();
        const opponentName = await auth.get_opponent_name();
    
        if (game.gameMode === 'distant') {
            if (!opponentName.other_player || !userInfo.username)
                return (1);
            if (game.playerRole === 'right') {
                document.getElementById('endGameUsername1').innerHTML = opponentName.other_player;
                document.getElementById('endGameUsername2').innerHTML = userInfo.username;
                document.getElementById('winner_endgame').textContent = (winner === 1) ? opponentName.other_player : userInfo.username;
            } else {
                document.getElementById('endGameUsername1').innerHTML = userInfo.username;
                document.getElementById('endGameUsername2').innerHTML = opponentName.other_player;
                document.getElementById('winner_endgame').textContent = (winner === 2) ? opponentName.other_player : userInfo.username;
            }
        } else {
            document.getElementById('endGameUsername1').innerHTML = userInfo.username;
            document.getElementById('endGameUsername2').innerHTML = "opponent";
            document.getElementById('winner_endgame').textContent = (winner === 1) ? userInfo.username : "opponent";
        }
        return (0);
    },

    displayEndGameStatsSurrender: function(player1Score, player2Score) {
        const duration = this.calculateGameDuration();
        const totalBalls = this.totalBallsServed;
        if (player1Score > player2Score) {
            winner = 1;
        }
        else {
            winner = 2;
        }
        document.getElementById('gameDuration').textContent = `Duration: ${duration.toFixed(2)} seconds`;
        document.getElementById('totalBalls').textContent = `Total balls served: ${totalBalls}`;
        ret = this.fetchGameResultDetails(game, winner);
        if (ret === 1)
            return;
        setTimeout(() => {
            if (this.endTime === null) {
                this.recordEndTime();
            }
            auth.retrieveInfos().then(userInfo => {
                username = userInfo.username;
                var opponent;
                auth.get_opponent_name().then(opponentName => {
                    opponent = opponentName.other_player;
                    if (userInfo && userInfo.username) {
                        var postData = {
                            player1: userInfo.username,
                            player2: "opponent",
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
                                    player2: opponent,
                                    player1_score: player2Score,
                                    player2_score: player1Score,
                                    start_time: stats.startTime.toISOString(),
                                    end_time: stats.endTime.toISOString()
                                };
                            }
                            else{
                                postData = {
                                    player1: userInfo.username,
                                    player2: opponent,
                                    player1_score: player1Score,
                                    player2_score: player2Score,
                                    start_time: stats.startTime.toISOString(),
                                    end_time: stats.endTime.toISOString()
                                };
                            }
                        }
                        if (postData.player1 && postData.player2 && postData.start_time && postData.end_time) {
                            fetch('/api/game_record/', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRFToken': getCookie('csrftoken')
                                },
                                body: JSON.stringify(postData)
                            })
                            .then(response => response.json())
                            .then(data => {})
                            .catch(error => {});
                        }
                        else
                            return;
                    } else {
                    }
                });
            }).catch(error => {
            });
            tournament.checkUserInTournament().then(isInTournament => {
                const returnHomeButton = document.getElementById('returnHome');
                const playAgainButton = document.getElementById('playAgain');
        
                if (isInTournament) {
                    auth.retrieveInfos().then(userInfo => {
                        if (game.playerRole === 'right')
                        {
                            if (player1Score > player2Score)
                            {
                                tournament.deleteUserFromTournament(userInfo.username);
                                auth.updateUserTournamentStatus('false');
                                ui.showOnlyOneSection('homepage');
                                gameSocket.leaveRoom(gameSocket.currentRoom);
                                gameSocket.deleteRoom(gameSocket.currentRoom);
                                return;
                            }
                        }
                        else
                        {
                            if (player1Score < player2Score)
                            {
                                tournament.deleteUserFromTournament(userInfo.username);
                                auth.updateUserTournamentStatus('false');
                                ui.showOnlyOneSection('homepage');
                                gameSocket.leaveRoom(gameSocket.currentRoom);
                                gameSocket.deleteRoom(gameSocket.currentRoom);
                                return;
                            }
                        }
                        gameSocket.leaveRoom(gameSocket.currentRoom);
                        gameSocket.deleteRoom(gameSocket.currentRoom);
                        tournament.currentRound += 1;
                        localStorage.setItem('currentRound', this.currentRound);
                        tournament.navigateToTournamentStage();
                        setTimeout(() => {
                            tournament.generateMatchTree();
                        },2000);
                    });
                } else {
                    if (game.gameMode !== 'distant') {
                        document.getElementById('playAgain').classList.remove('d-none');
                        playAgainButton.textContent = 'Play Again';
                        playAgainButton.onclick = this.playAgain;
                    }
                    else
                    {
                        document.getElementById('playAgain').classList.add('d-none');
                    }
        
                    returnHomeButton.textContent = 'Return to Home';
                    returnHomeButton.onclick = this.returnToHome;
                    ui.showOnlyOneSection('endgameStats');
                }
                if (game.gameMode === 'distant') {
                    fetch('/api/check-if-user-in-any-room/')
                        .then(response => {
                            if (response.ok) {
                                return response.json();
                            } else {
                                return response.text().then(text => { throw new Error(text || 'Problem checking room status'); });
                            }
                        })
                        .then(data => {
                            if (data.status === 'User is in a room') {
                                gameSocket.deleteRoom(data.rooms[0]);
                            }
                        })
                        .catch(error => {
                            ui.showGenericErrorModal('There was an error checking your room status. Please try again.');
                        });
                }
                game.gameMode = 'multiplayer';
            }).catch(error => {
            });
        }, 1000);
    },
        
    returnToHome: function() {
        ui.showOnlyOneSection('homepage');
        // location.reload();
    }
};

