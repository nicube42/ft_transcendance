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
            gameSocket.closeAndReinitialize();
            return auth.retrieveInfos();
        })
        .then(data => {
            console.log('User info retrieved successfully:', data);
            userInfoDisplayer.updateUI(data);
            settings.saveSettings();
            settings.populateSettings();
            ui.showOnlyOneSection('homepage');
            navbarManager.updateNavbar();
        })
        .catch(error => {
            console.error('Login error or failed to fetch/display user info:', error);
            // Show the modal if login fails or retrieving user info fails
            var loginErrorModal = new bootstrap.Modal(document.getElementById('loginErrorModal'));
            loginErrorModal.show();
        });
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
            ui.showOnlyOneSection('firstpage');
            navbarManager.updateNavbar();
        })
        .catch(error => console.error('Logout error:', error));
    },
    register: function() {
        // Assuming CSRF token is required here as well, fetching it from the cookie
        const csrfToken = getCookie('csrftoken'); // Using the getCookie function to retrieve the CSRF token
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
                'X-CSRFToken': csrfToken // Ensure this token is sent with the request
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
            navbarManager.updateNavbar();
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
        .catch(error => {
            console.error('Error fetching user info:', error);
            throw error;
        });
    },
    is_connected: function() {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        return isLoggedIn;
    },
    searchForUser: async function() {
        const input = document.getElementById('searchUserInput');
        const resultsDiv = document.getElementById('searchResults');
        resultsDiv.innerHTML = ''; // Clear previous results
    
        if (input.value.trim() === '') {
            const noResult = document.createElement('div');
            noResult.classList.add('alert', 'alert-danger');
            noResult.textContent = 'Please enter a username to search.';
            resultsDiv.appendChild(noResult);
            return;
        }
    
        try {
            const response = await fetch(`/api/search-user/?username=${encodeURIComponent(input.value)}`, {
                method: 'GET',
                credentials: 'include', // This is important for sessions to work
            });
    
            if (response.status === 404) {
                throw new Error('User not found');
            }
    
            if (!response.ok) {
                throw new Error('Request failed with status: ' + response.status);
            }
    
            const data = await response.json();
            const result = document.createElement('div');
            result.classList.add('alert', 'alert-success');
            result.textContent = `Found user: ${data.username}, Full Name: ${data.fullname}, Bio: ${data.bio}`;
            resultsDiv.appendChild(result);
            console.log('Search success:', data);
        } catch (error) {
            console.error('Search error:', error);
            const noResult = document.createElement('div');
            noResult.classList.add('alert', 'alert-danger');
            noResult.textContent = error.toString();
            resultsDiv.appendChild(noResult);
        }
    },
};

// Utility function to get a cookie by name
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.startsWith(name + '=')) {
                cookieValue = cookie.substring(name.length + 1);
                break;
            }
        }
    }
    return cookieValue;
}

// Attach events for login and registration forms
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    auth.login();
});

// Make sure to check if the element exists before attaching an event listener to avoid errors
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        auth.register();
    });
}
