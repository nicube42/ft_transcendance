const settings = {
    populateSettings: function() {
        if (auth.is_connected() == false) {
            return;
        }
        fetch('/api/settings/retrieve')
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
        if (auth.is_connected() === false) {
            return;
        }
        const csrfToken = getCookie('csrftoken');
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
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save settings');
            }
            console.log('Settings saved successfully');
        })
        .catch(error => {
            console.error('Error saving settings:', error);
        });
    }
};

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = cookie.substring(name.length + 1);
                break;
            }
        }
    }
    return cookieValue;
}
