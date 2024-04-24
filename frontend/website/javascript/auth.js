const auth = {
    login: function() {
        const csrfToken = getCookie('csrftoken');
        const formData = {
            username: document.getElementById('id_username').value,
            password: document.getElementById('id_password').value
        };
        fetch('/api/login/', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Login success:', data);
            sessionStorage.setItem('isLoggedIn', 'true');
            this.waitForAuthToBeRecognized(() => {
                auth.retrieveInfos()
                    .then(data => {
                        console.log('User info retrieved successfully:', data);
                        userInfoDisplayer.updateUI(data);
                        settings.saveSettings();
                        settings.populateSettings();
                        ui.showOnlyOneSection('homepage');
                        navbarManager.updateNavbar(true);
                    })
                    .catch(error => {
                        console.error('Failed to fetch/display user info:', error);
                    });
            }, (error) => {
                console.error('Auth recognition error:', error);
            });
        })
        .catch(error => {
            console.error('Login error:', error);
            var loginErrorModal = new bootstrap.Modal(document.getElementById('loginErrorModal'));
            loginErrorModal.show();
        });
    },

    waitForAuthToBeRecognized : function(successCallback, errorCallback) {
        const maxAttempts = 5;
        let attempts = 0;
        console.log('waiting for auth to be recognized');

        const checkAuth = () => {
            fetch('/api/check_auth_status/', {
                method: 'GET',
                credentials: 'include'
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Auth check failed');
            })
            .then(data => {
                if (data.is_authenticated) {
                    successCallback();
                } else if (attempts < maxAttempts) {
                    setTimeout(checkAuth, 1000);
                    attempts++;
                } else {
                    throw new Error('Max auth check attempts reached');
                }
            })
            .catch(error => {
                errorCallback(error);
            });
        };

        checkAuth();
    },
    
    logout: function() {
        console.log('Logging out...');
        const csrfToken = getCookie('csrftoken');
        fetch('/api/logout/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Logout success:', data);
            sessionStorage.removeItem('isLoggedIn');
            ui.showOnlyOneSection('loginContainer');
            navbarManager.updateNavbar(false);
            ui.connected = false;
        })
        .catch(error => console.error('Logout error:', error));
    },

    @require_POST
    register: function() {
        console.log('Registering...');
        const csrfToken = getCookie('csrftoken');

        const formData = new FormData();
        formData.append('username', document.getElementById('username').value);
        formData.append('password', document.getElementById('password').value);
        formData.append('fullname', document.getElementById('fullname').value);
        formData.append('picture', document.getElementById('picture').files[0]);

        fetch('/api/register/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: formData,

        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Registration success:', data);
            ui.showOnlyOneSection('loginContainer');
        })
        .catch(error => {
            console.error('Registration error:', error)
            var registrationErrorModal = new bootstrap.Modal(document.getElementById('registerErrorModal'));
            registrationErrorModal.show();
        });
    },

    intraCallback: function() {
        console.log('Intra callback...');
        const csrfToken = getCookie('csrftoken');
        const formData = {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            fullname: document.getElementById('fullname').value,
        };
        fetch('/api/register/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Registration success:', data);
            ui.showOnlyOneSection('loginContainer');
        })
        .catch(error => {
            console.error('Registration error:', error)
            var registrationErrorModal = new bootstrap.Modal(document.getElementById('registerErrorModal'));
            registrationErrorModal.show();
        });
    },
    retrieveInfos: function() {
        console.log('Retrieving user info...');
        return fetch('/api/user-info/', {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error('Error fetching user info:', data.error);
            } else {
                console.log('User info retrieved:', data);
            }
            return data;
        })
        .catch(error => {
            console.error('Error fetching user info:', error);
            throw error;
        });
    },
    
    is_connected: function() {
        this.checkAuthentication();
    },
    checkAuthentication: function() {
        console.log('Checking authentication...');
        return fetch('/api/check_auth_status/', {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => {
            if (response.status === 401 || response.status === 403) {
                return false;
            } else if (!response.ok) {
                throw new Error('Server error or network issue.');
            }
            return response.json();
        })
        .then(data => {
            if (data.is_authenticated) {
                console.log("User is authenticated.");
                return true;
            } else {
                return false;
            }
        })
        .catch(error => {
            console.error(error.message);
            return false;
        });
    },
    checkIfUserLoggedIn: async function(username) {
        console.log('Checking if user is logged in:', username);
        try {
            const response = await fetch(`/api/is-user-logged-in/?username=${encodeURIComponent(username)}`, {
                method: 'GET',
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error(`Request failed with status: ${response.status}`);
            }
            const data = await response.json();
            if (data.is_logged_in) {
                console.log(`User ${username} is currently logged in.`);
                alert(`User ${username} has been invited.`);
                return username;
            } else {
                console.log(`User ${username} is not logged in.`);
                alert(`User ${username} is not logged in.`);
                return null;
            }
        } catch (error) {
            console.error('Error checking user login status:', error);
            alert('Error checking user login status.');
        }
    },
    updateUserGameStatus: function(isInGame) {
        console.log('Attempting to update game status to:', isInGame);
        fetch('/api/update_game_status/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken()
            },
            body: JSON.stringify({
                is_in_game: isInGame
            })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Failed to update game status');
            }
        })
        .then(data => {
            console.log('Game status updated:', data);
        })
        .catch(error => {
            console.error('Error updating game status:', error);
        });
    },

    updateUserTournamentStatus: function(isInTournament) {
        console.log('Attempting to update tournament status to:', isInTournament);
        fetch('/api/update_tournament_status/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken()
            },
            body: JSON.stringify({
                is_in_tournament: isInTournament
            })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Failed to update tournament status');
            }
        })
        .then(data => {
            console.log('Tournament status updated:', data);
        })
        .catch(error => {
            console.error('Error updating tournament status:', error);
        });
    },    

    getCSRFToken: function() {
        var cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = cookies[i].trim();
                if (cookie.substring(0, 10) === ('csrftoken=')) {
                    cookieValue = decodeURIComponent(cookie.substring(10));
                    break;
                }
            }
        }
        return cookieValue;
    },

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

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    auth.login();
});

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        auth.register();
    });
}

document.getElementById('inviteRoomBtn').addEventListener('click', function() {
    const username = document.getElementById('usernameInput').value.trim();
    if (username) {
        const roomName = gameSocket.currentRoom;
        user = auth.checkIfUserLoggedIn(username);
        if (user != null) {
            gameSocket.sendInvite(username, roomName);
        }
    } else {
        alert('Please enter a username.');
    }
});

