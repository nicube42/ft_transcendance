const GameStats = {
    fetchPlayerStats: function() {
        fetch('/api/player/stats/')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
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
                if (games.error) {
                    throw new Error(games.error);
                }
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
                if (data.error) {
                    throw new Error(data.error);
                } else {
                    GameStats.drawLineChart(data);
                }
            })
            .catch(error => console.error('Error fetching win rate data:', error));
    },
    
    drawLineChart: function(data) {
        const canvas = document.getElementById('winRateChart');
        const ctx = canvas.getContext('2d');
    
        // Clear previous drawing
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        // Setup
        const padding = 50;
        const pointRadius = 5;
        const chartHeight = canvas.height - 2 * padding;
        const chartWidth = canvas.width - 2 * padding;
        const maxWinRate = 100; // Win rate goes from 0% to 100%
    
        // Draw axes
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, padding + chartHeight);
        ctx.lineTo(padding + chartWidth, padding + chartHeight);
        ctx.stroke();
    
        // Handle single data point scenario
        if (data.dates.length === 1) {
            // Calculate single point
            const x = padding + chartWidth / 2; // Center the point
            const y = padding + chartHeight * (1 - data.winRates[0] / maxWinRate);
    
            // Draw point
            ctx.fillStyle = 'rgb(75, 192, 192)';
            ctx.beginPath();
            ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
            ctx.fill();
    
            // Label the point
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(data.dates[0], x, padding + chartHeight + 10);
            ctx.fillText(`${data.winRates[0]}%`, x, y - 10);
        } else {
            // Calculate points for multiple dates
            const xIncrement = chartWidth / (data.dates.length - 1);
            const points = data.winRates.map((rate, index) => ({
                x: padding + xIncrement * index,
                y: padding + chartHeight * (1 - rate / maxWinRate)
            }));
    
            // Draw line
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach(point => ctx.lineTo(point.x, point.y));
            ctx.stroke();
    
            // Draw points
            ctx.fillStyle = 'rgb(75, 192, 192)';
            points.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, pointRadius, 0, Math.PI * 2);
                ctx.fill();
            });
    
            // Label axes for multiple points
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            data.dates.forEach((date, index) => {
                ctx.fillText(date, padding + xIncrement * index, padding + chartHeight + 10);
            });
        }
    
        // Label y-axis
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= maxWinRate; i += 10) {
            ctx.fillText(`${i}%`, padding - 10, padding + chartHeight * (1 - i / maxWinRate));
        }
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