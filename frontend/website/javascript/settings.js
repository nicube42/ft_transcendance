const settings = {
    populateSettings: async function() {
        if (!sessionStorage.getItem('isLoggedIn')){return;}
        await fetch('/api/settings/retrieve')
            .then(response => response.json())
            .then(data => {
                if (game.gameMode === 'distant'){
                    return ;
                }
                document.getElementById('player1').value = data.player1;
                if (data.player1 === null)
                    document.getElementById('player1').value = 'One';
                document.getElementById('player2').value = data.player2;
                if (data.player2 === null)
                    document.getElementById('player2').value = 'Two';
                document.getElementById('ballSpeed').value = data.ballSpeed;
                if (data.ballSpeed === null)
                    document.getElementById('ballSpeed').value = 5;
                document.getElementById('paddleSpeed').value = data.paddleSpeed;
                if (data.paddleSpeed === null)
                    document.getElementById('paddleSpeed').value = 5;
                document.getElementById('winningScore').value = data.winningScore;
                if (data.winningScore === null)
                    document.getElementById('winningScore').value = 5;
                document.getElementById('Bonus').checked = data.bonus;
                if (data.bonus === null)
                    document.getElementById('Bonus').checked = true;
                game.updateGameSettings(data);
            })
            .catch(error => {});
    },
    saveSettings: async function() {
        if (ui.connected === false) {
            return;
        }
        const csrfToken = getCookie('csrftoken');
        
        const data = {
            player1: document.getElementById('player1').value,
            player2: document.getElementById('player2').value,
            ballSpeed: parseInt(document.getElementById('ballSpeed').value, 10),
            paddleSpeed: parseInt(document.getElementById('paddleSpeed').value, 10),
            winningScore: parseInt(document.getElementById('winningScore').value, 10),
            bonus: document.getElementById('Bonus').checked,
        };
        await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save settings');
            }
        })
        .catch(error => {
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
