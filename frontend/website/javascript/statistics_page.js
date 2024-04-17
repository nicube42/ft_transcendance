const GameStats = {
    fetchPlayerStats: function() {
        fetch('/api/player/stats/')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Error fetching player stats:', data.error);
                } else {
                    console.log('Received data:', data);
                    document.getElementById('gamesPlayed').textContent = data.gamesPlayed;
                    document.getElementById('totalWins').textContent = data.totalWins;
                    document.getElementById('totalLosses').textContent = data.totalLosses;
                    document.getElementById('totalScore').textContent = data.totalScore;
                }
            })
            .catch(error => console.error('Error fetching player stats:', error));
    },    

    fetchRecentGames: function() {
        fetch('/api/recent_games/')
            .then(response => response.json())
            .then(games => {
                const gamesList = document.getElementById('gamesList');
                gamesList.innerHTML = '';
                games.forEach(game => {
                    const listItem = document.createElement('li');
                    listItem.className = 'list-group-item';
                    listItem.textContent = `${game.player1} vs ${game.player2} - Score: ${game.player1_score}-${game.player2_score}, Duration: ${game.duration.toFixed(2)} seconds`;
                    gamesList.appendChild(listItem);
                });
            })
            .catch(error => console.error('Error fetching recent games:', error));
    },    

    init: function() {
        document.addEventListener('DOMContentLoaded', () => {
            this.fetchPlayerStats();
            this.fetchRecentGames();
        });
    } 
};

GameStats.init();
