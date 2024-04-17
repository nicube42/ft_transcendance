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
                        navbarManager.updateNavbar({ isAuthenticated: true });
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
            navbarManager.updateNavbar({ isAuthenticated: false });
            ui.connected = false;
        })
        .catch(error => console.error('Logout error:', error));
    },
    register: function() {
        const csrfToken = getCookie('csrftoken');
        const formData = {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            fullname: document.getElementById('fullname').value,
            date_of_birth: document.getElementById('birth').value,
            bio: document.getElementById('bio').value
        };
        fetch('/api/register/', {
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
                console.log('User info retrieved:', data);  // Log or use data as needed
            }
            return data;  // Return data for further handling
        })
        .catch(error => {
            console.error('Error fetching user info:', error);
            throw error;  // Re-throw to handle it in further catch blocks
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
                return { isAuthenticated: false };
            } else if (!response.ok) {
                throw new Error('Server error or network issue.');
            }
            return response.json();
        })
        .then(data => {
            if (data.is_authenticated) {
                console.log("User is authenticated.");
                return { isAuthenticated: true };
            } else {
                return { isAuthenticated: false };
            }
        })
        .catch(error => {
            console.error(error.message);
            return { isAuthenticated: false };
        });
    },
    checkIfUserLoggedIn: async function(username) {
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

