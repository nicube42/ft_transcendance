var friendsPage = {
    initialize: function() {
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('searchFriendsBtn').addEventListener('click', this.searchFriends.bind(this));
            this.listFriends();
        });
    },

    showUserProfile: function(username) {
        fetch(`/api/get_user_profile/${username}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                document.getElementById('friends').classList.add('d-none');
                document.getElementById('profilePageNoChange').classList.remove('d-none');
                document.getElementById('usernameProfileNoChange').textContent = `Username: ${data.username}`;
                document.getElementById('fullnameProfileNoChange').textContent = `Full Name: ${data.fullname}`;
                document.getElementById('birthProfileNoChange').textContent = `Date of Birth: ${data.date_of_birth}`;
                document.getElementById('profilePicNoChange').src = data.profile_pic;
                document.getElementById('csrfTokenProfilePic').value = this.getCSRFToken();
            }
        })
        .catch(error => console.error('Error fetching profile:', error));
    },

    fetchStatsForUser: function(username) {
        fetch(`/api/player_stats/${username}/`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error fetching player stats:', data.error);
            } else {
                document.getElementById('friends').classList.add('d-none');
                document.getElementById('gamesPlayed').textContent = data.gamesPlayed;
                document.getElementById('totalWins').textContent = data.totalWins;
                document.getElementById('totalLosses').textContent = data.totalLosses;
                document.getElementById('totalScore').textContent = data.totalScore;
            }
        })
        .catch(error => console.error('Error fetching player stats:', error));
        this.fetchRecentGames(username);
        this.fetchWinRateData(username);
    },

    fetchRecentGames: function(username) {
        fetch(`/api/recent_games/${username}/`)
        .then(response => response.json())
        .then(data => {
            const gamesList = document.getElementById('gamesList');
            gamesList.innerHTML = '';
            data.forEach(game => {
                let listItem = document.createElement('li');
                listItem.className = 'list-group-item';
                listItem.textContent = `${game.player1} vs ${game.player2} - Score: ${game.player1_score}-${game.player2_score}, Duration: ${game.duration}, Start: ${game.start_time}`;
                gamesList.appendChild(listItem);
            });
        })
        .catch(error => console.error('Error fetching recent games:', error));
    },

    fetchWinRateData: function(username) {
        fetch(`/api/win_rate_over_time/${username}/`)
        .then(response => response.json())
        .then(data => {
            if (data.dates.length > 0) {
                GameStats.drawLineChart(data);
            } else {
                console.log('No win rate data available');
            }
        })
        .catch(error => console.error('Error fetching win rate data:', error));
    },

    goToStats: function(username) {
        console.log("Viewing stats for", username);
        this.fetchStatsForUser(username);
        document.getElementById('playerStats').classList.remove('d-none');
    },

    addFriend: function(username) {
        const csrfToken = this.getCSRFToken();
        if (!csrfToken) {
            console.error('CSRF token is not available.');
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
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.exists) {
                console.log("User exists, adding as friend");
                this.performAddFriend(username);
            } else {
                alert("User does not exist");
            }
        })
        .catch(error => console.error('Error:', error));
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
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
            this.listFriends();
        })
        .catch(error => console.error('Error adding friend:', error));
    },

    listFriends: function() {
        fetch('/api/list_friends/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(response => response.json())
        .then(data => {
            const friendsList = document.getElementById('friendsList');
            friendsList.innerHTML = '';
            data.friends.forEach(friend => {
                const item = document.createElement('li');
                item.innerHTML = `<span class="status-indicator" id="status-${friend.username}">●</span> ${friend.username} (${friend.fullname})
                                    <button class="btn btn-outline-success" style="width:80px; height:50px; font-size: 0.8rem;" onclick="friendsPage.showUserProfile('${friend.username}')">View Profile</button>
                                    <button class="btn btn-outline-success" style="width:80px; height:50px; font-size: 0.8rem;" onclick="friendsPage.goToStats('${friend.username}')">View Stats</button>`;
                friendsList.appendChild(item);
    
                setTimeout(() => {
                    gameSocket.sendUserStatusRequest(friend.username);
                    gameSocket.checkIfUserInGame(friend.username);
                }, 2000);
            });
        })
        .catch(error => console.error('Error listing friends:', error));
    },    

    searchFriends: function() {
        var searchQuery = document.getElementById('searchFriendsInput').value;
        this.addFriend(searchQuery);
    },

    getCSRFToken: function() {
        var csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
        return csrfToken ? csrfToken.split('=')[1] : null;
    }    
};

friendsPage.initialize();