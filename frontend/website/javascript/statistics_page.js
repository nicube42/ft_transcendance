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
                    listItem.textContent = `${game.player1} vs ${game.player2} - Score: ${game.player1_score}-${game.player2_score}, Duration: ${game.duration.toFixed(2)} seconds, Created: ${game.created_at}`;
                    gamesList.appendChild(listItem);
                });
            })
            .catch(error => console.error('Error fetching recent games:', error));
    },
    
    fetchWinRateData: function() {
        fetch('/api/winrate_over_time/')
            .then(response => response.json())
            .then(data => {
                this.renderWinRateChart(data);
            })
            .catch(error => console.error('Error fetching win rate data:', error));
    },
    
    renderWinRateChart: function(data) {
        const ctx = document.getElementById('winRateChart').getContext('2d');
        const winRateChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.dates, // Assuming 'dates' is an array of date strings
                datasets: [{
                    label: 'Win Rate',
                    data: data.winRates, // Assuming 'winRates' is an array of win rate values
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100, // As win rate percentage
                        title: {
                            display: true,
                            text: 'Win Rate (%)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });
    },

    init: function() {
        document.addEventListener('DOMContentLoaded', () => {
            this.fetchPlayerStats();
            this.fetchRecentGames();
            this.fetchWinRateData();
        });
    } 
};

GameStats.init();
