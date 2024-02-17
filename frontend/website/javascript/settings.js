const settings = {
    populateSettings: function() {
        fetch('/api/settings')
            .then(response => response.json())
            .then(data => {
                document.getElementById('player1').value = data.player1;
                document.getElementById('player2').value = data.player2;
                document.getElementById('ballSpeed').value = data.ballSpeed;
                document.getElementById('paddleSpeed').value = data.paddleSpeed;
                document.getElementById('winningScore').value = data.winningScore;
                
                game.updateGameSettings(data);
            })
            .catch(error => console.error('Error fetching settings:', error));
    },
    saveSettings: function() {
        // Construct the data object to send to the backend
        const data = {
            player1: document.getElementById('player1').value,
            player2: document.getElementById('player2').value,
            ballSpeed: parseInt(document.getElementById('ballSpeed').value, 10),
            paddleSpeed: parseInt(document.getElementById('paddleSpeed').value, 10),
            winningScore: parseInt(document.getElementById('winningScore').value, 10)
        };
        fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save settings');
            }
            // Handle success response here
            console.log('Settings saved successfully');
        })
        .catch(error => {
            // Handle error here
            console.error('Error saving settings:', error);
        });
        
    }
    
};
