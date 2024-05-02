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
            ui.connected = true;
            this.waitForAuthToBeRecognized(() => {
                auth.retrieveInfos()
                    .then(data => {
                        console.log('User info retrieved successfully:', data);
                        userInfoDisplayer.updateUI(data);
                        settings.saveSettings();
                        settings.populateSettings();
                        ui.showOnlyOneSection('homepage');
                        navbarManager.updateNavbar(true);
                        location.reload();
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

    register: function() {
        console.log('Registering...');
        const csrfToken = getCookie('csrftoken');

        const formData = new FormData();
        formData.append('username', document.getElementById('username').value);
        formData.append('password', document.getElementById('password').value);
        formData.append('fullname', document.getElementById('fullname').value);
        formData.append('profile_pic', document.getElementById('picture').files[0]);

        let username = formData.get("username");
        let password = formData.get("password");
        if (username.length < 4 || username.length > 20) {
            alert('Username must be between 4 and 20 characters.');
            return;
        }
        if (password.length < 4 || password.length > 20) {
            alert('Password must be between 4 and 20 characters.');
            return;
        }
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

    callback: function() {
        const url = new URL(window.location.href);
        console.log('url:', url.href);
        ui.showOnlyOneSection('callback');
        console.log('callback exception2 called');
        const code = url.searchParams.get("code");
        if (code === null) {
            console.error("No code in URL");
            return;
        }
        fetch(
            `https://localhost:4242/api/callback/?code=${code}`, {
                method: "GET",
                headers: {
                    "accept": "application/json",
                },
                credentials: 'include'
            }
        ).then(response => {
            if (!response.ok) {
                throw new Error('Network response for login intra 42 was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Login success:', data);
            sessionStorage.setItem('isLoggedIn', 'true');
            ui.connected = true;
            auth.waitForAuthToBeRecognized(() => {
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
        console.log('callback exception3 called');
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
        auth.retrieveInfos().then(userInfo => {
            const user = userInfo.username;
            if (user === username) {
                alert('You cannot add yourself to the room');
                return;
            }
            else
            {
                const userName = auth.checkIfUserLoggedIn(username);
                if (userName != null) {
                    gameSocket.sendInvite(username, roomName);
                }
            }
        });
    } else {
        alert('Please enter a username.');
    }
});

