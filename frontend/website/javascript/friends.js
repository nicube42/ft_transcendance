var friendsPage = {
    initialize: function() {
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('searchFriendsBtn').addEventListener('click', this.searchFriends.bind(this));
            document.getElementById('refreshFriendsBtn').addEventListener('click', this.listFriends.bind(this));
            this.listFriends();
        });
        this.listFriends();
    },

    showUserProfile: function(username) {
        this.listFriends();
        fetch(`/api/get_user_profile/${username}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 403) {
                    ui.showGenericErrorModal('You are not friends.');
                }
                throw new Error(response.error);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                ui.showGenericErrorModal(data.error);
            } else {
                auth.retrieveInfos().then(userInfo => {
                    if (userInfo.username === username) {
                        document.getElementById('editProfileButton').classList.remove('d-none');
                    } else {
                        document.getElementById('editProfileButton').classList.add('d-none');
                    }
                });
                document.getElementById('friends').classList.add('d-none');
                document.getElementById('profilePageNoChange').classList.remove('d-none');
                document.getElementById('usernameProfileNoChange').textContent = `${data.username}`;
                document.getElementById('fullnameProfileNoChange').textContent = `${data.fullname}`;
                if (data.profile_pic_url) {
                    document.getElementById('profilePicNoChange').src = data.profile_pic_url;
                }
                else {
                    document.getElementById('profilePicNoChange').src = '/media/pictures/default.jpg';
                }
                document.getElementById('csrfTokenProfilePic').value = this.getCSRFToken();
            }
        })
        .catch(error => {});
    },

    fetchStatsForUser: function(username) {
        fetch(`/api/player_stats/${username}/`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 403) {
                    ui.showGenericErrorModal('You are not friends.');
                }
                throw new Error(response.error);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error('Error fetching player stats:', data.error);
            } else {
                document.getElementById('friends').classList.add('d-none');
                document.getElementById('gamesPlayed').textContent = data.gamesPlayed;
                document.getElementById('totalWins').textContent = data.totalWins;
                document.getElementById('totalLosses').textContent = data.totalLosses;
                document.getElementById('totalScore').textContent = data.totalScore;
                ui.showOnlyOneSection('playerStats');
            }
        })
        .catch(error => {});
        this.fetchRecentGames(username);
        this.fetchWinRateData(username);
    },

    fetchRecentGames: function(username) {
        console.log(username);
        if (!sessionStorage.getItem('isLoggedIn')){return;}
        fetch(`/api/recent_games/${username}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(response.error);
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            const gamesList = document.getElementById('gamesList');
            gamesList.innerHTML = '';
            data.forEach(game => {
                // let listItem = document.createElement('li');
                // listItem.className = 'list-group-item';
                // listItem.textContent = `${game.player1} vs ${game.player2} - Score: ${game.player1_score}-${game.player2_score}, Duration: ${game.duration}, Start: ${game.start_time}`;
                // gamesList.appendChild(listItem);
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item game-item';
    
                let gameInfoDiv = document.createElement('div');
                gameInfoDiv.classList.add('game-info'); 
    
                let players = document.createElement('p');
                players.className = 'game-players';
                players.textContent = `${game.player1} vs ${game.player2}`;
                gameInfoDiv.appendChild(players);
    
                let score = document.createElement('p');
                score.className = 'game-score';
                score.textContent = `Score: ${game.player1_score}-${game.player2_score}`;
                gameInfoDiv.appendChild(score);
    
                let duration = document.createElement('p');
                duration.className = 'game-duration';
                duration.textContent = `Duration: ${game.duration.toFixed(2)} seconds`;
                gameInfoDiv.appendChild(duration);
    

                let created = document.createElement('p');
                created.className = 'game-created';
                created.textContent = `Created: ${game.created_at}`;
                gameInfoDiv.appendChild(created);
    

                listItem.appendChild(gameInfoDiv);
                gamesList.appendChild(listItem);
            });
        })
        .catch(error => {});
    },

    fetchWinRateData: function(username) {
        fetch(`/api/win_rate_over_time/${username}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(response.error);

            }
            return response.json();
        })
        .then(data => {
            if (data.dates.length > 0) {
                GameStats.drawLineChart(data);
            }
        })
        .catch(error => {});
    },

    goToStats: function(username) {
        this.listFriends();
        // displays the stats of the user
        this.fetchStatsForUser(username);
    },

    addFriend: function(username) {
        const csrfToken = this.getCSRFToken();
        if (!csrfToken) {
            throw new Error('CSRF token is not available.');
            return;
        }
    
        fetch('/api/check_user/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ username: username })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(response.error);
            }
            return response.json();
        })
        .then(data => {
            if (data.exists) {
                this.performAddFriend(username);
            } else {
                ui.showGenericErrorModal(username + " does not exist");
            }
        })
        .catch(error => {});
    },

    deleteFriend: function(username) {
        fetch('/api/delete_friend/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken()
            },
            body: JSON.stringify({ friend_username: username })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                this.listFriends();
            } else if (data.error) {
            }
        })
        .catch(error => {});
    },

    performAddFriend: function(username) {
        const csrfToken = this.getCSRFToken();
        fetch('/api/add_friend/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ friend_username: username })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(response.error);
            }
            return response.json();
        })
        .then(data => {
            this.listFriends();
        })
        .catch(error => {});
    },

    listFriends: function() {
        if (!sessionStorage.getItem('isLoggedIn')){return;}
        fetch('/api/list_friends/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(response.error);
            }
            return response.json();
        })
        .then(data => {
            const friendsList = document.getElementById('friendsList');
            friendsList.innerHTML = '';
            data.friends.forEach(friend => {
                const item = document.createElement('li');
                item.innerHTML = `<span class="status-indicator" id="status-${friend.username}">●</span> ${friend.username} (${friend.fullname})
                                  <button class="btn btn-outline-success" style="width:80px; height:50px; font-size: 0.8rem;" onclick="friendsPage.showUserProfile('${friend.username}')">View Profile</button>
                                  <button class="btn btn-outline-success" style="width:80px; height:50px; font-size: 0.8rem;" onclick="friendsPage.goToStats('${friend.username}')">View Stats</button>
                                  <button class="btn btn-outline-danger" style="width:80px; height:50px; font-size: 0.8rem;" onclick="friendsPage.deleteFriend('${friend.username}')">✖</button>`;
                friendsList.appendChild(item);
    
                setTimeout(() => {
                    gameSocket.sendUserStatusRequest(friend.username);
                    gameSocket.checkIfUserInGame(friend.username);
                }, 2000);
            });
        })
        .catch(error => {});
    },       

    searchFriends: function() {
        var searchQuery = document.getElementById('searchFriendsInput').value;
        if (searchQuery === '') {
            ui.showGenericErrorModal('Please enter a username to search for');
            return;
        }
        auth.retrieveInfos().then(userInfo => {
            const username = userInfo.username;
            if (searchQuery === username) {
                ui.showGenericErrorModal('You cannot add yourself as a friend');
                return;
            }
            else
            {
                this.addFriend(searchQuery);
            }
        });
    },

    getCSRFToken: function() {
        var csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
        return csrfToken ? csrfToken.split('=')[1] : null;
    }    
};

friendsPage.initialize();