const auth = {

    loginErrorModal: function(error) {
        var modal = new bootstrap.Modal(document.getElementById('loginErrorModal'));
        var modalBody = document.getElementById('loginErrorBody');
        modalBody.innerHTML = error;
        modal.show();
    },

    login: function() {
        const csrfToken = getCookie('csrftoken');
        const formData = {
            username: document.getElementById('id_username').value,
            password: document.getElementById('id_password').value
        };

        let username = formData.username;
        if (username.length < 4 || username.length > 20) {
            this.loginErrorModal('Username must be between 4 and 20 characters.');
            return;
        }
        let password = formData.password;
        if (password.length < 4 || password.length > 20) {
            this.loginErrorModal('Password must be between 4 and 20 characters.');
            return;
        }
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
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            sessionStorage.setItem('isLoggedIn', 'true');
            ui.connected = true;
            this.waitForAuthToBeRecognized(() => {
                auth.retrieveInfos()
                    .then(data => {
                        userInfoDisplayer.updateUI(data);
                        if (game.gameMode !== 'distant' && !game.isPlaying){

                            settings.saveSettings();
                            settings.populateSettings();
                        }
                        ui.showOnlyOneSection('homepage');
                        navbarManager.updateNavbar(true);
                    })
                    .catch(error => {
                    });
            }, (error) => {
            });
        })
        .catch(error => {
            this.loginErrorModal(error);
        });
    },

    waitForAuthToBeRecognized : function(successCallback, errorCallback) {
        const maxAttempts = 5;
        let attempts = 0;
        
        const checkAuth = () => {
            if (!sessionStorage.getItem('isLoggedIn')){return;}
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
        const csrfToken = getCookie('csrftoken');
        sessionStorage.removeItem('isLoggedIn');
        ui.showOnlyOneSection('loginContainer');
        navbarManager.updateNavbar(false);
        ui.connected = false;
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
                throw new Error(response.error);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
        })
        .catch(error => {});
    },

    registerErrorModal: function(error) {
        var modal = new bootstrap.Modal(document.getElementById('registerErrorModal'));
        var modalBody = document.getElementById('registerErrorBody');
        modalBody.innerHTML = error;
        modal.show();
    },

    register: function() {
        const csrfToken = getCookie('csrftoken');

        const formData = new FormData();
        formData.append('username', document.getElementById('username').value);
        formData.append('password', document.getElementById('password').value);
        formData.append('fullname', document.getElementById('fullname').value);
        formData.append('profile_pic', document.getElementById('picture').files[0]);

        let profilePic = formData.get('profile_pic');
        if(profilePic.size > 0)
        {
            if (profilePic.size > 1024 * 1024) {
                this.registerErrorModal('Profile picture must be less than 1MB.');
                return;
            }
            let allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;
            if (!allowedExtensions.exec(profilePic.name)) {
                this.registerErrorModal('Profile picture must be a jpg, jpeg, or png file.');
                return;
            }
        }
        let fullname = formData.get("fullname");
        if (fullname.length < 4 || fullname.length > 20) {
            this.registerErrorModal('Full name must be between 4 and 20 characters.');
            return;
        }
        let username = formData.get("username");
        if (username.length < 4 || username.length > 20) {
            this.registerErrorModal('Username must be between 4 and 20 characters.');
            return;
        }
        let password = formData.get("password");
        if (password.length < 4 || password.length > 20) {
            this.registerErrorModal('Password must be between 4 and 20 characters.');
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
            if (!response.ok && response.status !== 400 && response.status !== 405) {
                throw new Error("Server error or network issue.");
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            ui.showOnlyOneSection('loginContainer');
        })
        .catch(error => {
            this.registerErrorModal(error);
        });
    },

    callback: function() {
        const url = new URL(window.location.href);
        ui.showOnlyOneSection('callback');
        const code = url.searchParams.get("code");
        if (code === null) {
            return;
        }
        fetch(
            `/api/callback/?code=${code}`, {
                method: "GET",
                headers: {
                    "accept": "application/json",
                },
                credentials: 'include'
            }
        ).then(response => {
            if (!response.ok) {
                throw new Error(response.error);
            }
            return response.json();
        })
        .then(data => {
            sessionStorage.setItem('isLoggedIn', 'true');
            ui.connected = true;
            auth.waitForAuthToBeRecognized(() => {
                auth.retrieveInfos()
                    .then(data => {
                        userInfoDisplayer.updateUI(data);
                        settings.saveSettings();
                        settings.populateSettings();
                        ui.showOnlyOneSection('homepage');
                        navbarManager.updateNavbar(true);
                    })
                    .catch(error => {
                    });
            }, (error) => {
            });
        })
        .catch(error => {
        });
    },

    retrieveInfos: function() {
        return new Promise((resolve, reject) => {
            if (!sessionStorage.getItem('isLoggedIn')) {
                resolve();
                return;
            }
            fetch('/api/user-info/', {
                method: 'GET',
                credentials: 'include'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(response.error);
                }
                return response.json();
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => {
            });
        });
    },
    
    is_connected: function() {
        this.checkAuthentication();
    },
    checkAuthentication: function() {
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
                return true;
            } else {
                return false;
            }
        })
        .catch(error => {
            return false;
        });
    },
    checkIfUserLoggedIn: async function(username) {
        if (game.gameMode !== 'distant')
            return null;
        try {
            const response = await fetch(`/api/is-user-logged-in/?username=${encodeURIComponent(username)}`, {
                method: 'GET',
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error('Failed to check for ' + username);
            }
            const data = await response.json();
            if (data.is_logged_in) {
                ui.showGenericSuccessModal(`User ${username} has been invited.`)
                return username;
            } else {
                ui.showGenericErrorModal(`User ${username} is not logged in.`);
                return null;
            }
        } catch (error) {
        }
    },
    updateUserGameStatus: function(isInGame) {
        if (!sessionStorage.getItem('isLoggedIn')){return;}
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
            if (!response.ok) {
                throw new Error('Failed to update');
            }
            return response.json();
        })
        .then(data => {
        })
        .catch(error => {
        });
    },

    updateUserTournamentStatus: function(isInTournament) {
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
            if (!response.ok) {
                throw new Error('Failed to update tournament status');
            }
            return response.json();
        })
        .then(data => {
        })
        .catch(error => {
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

    get_opponent_name: function() {
        return fetch('/api/list-other-players-in-room/', {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .catch(error => {
            throw error;
        });
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
                ui.showGenericErrorModal('You cannot add yourself to the room');
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
        ui.showGenericErrorModal('Please enter a username.');
    }
});

