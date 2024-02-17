const auth = {
    login: function() {
        // Fetch the CSRF token from the cookie instead of the form
        const csrfToken = getCookie('csrftoken'); // Using the getCookie function to retrieve the CSRF token
        const formData = {
            username: document.getElementById('id_username').value,
            password: document.getElementById('id_password').value
        };
        fetch('/api/login/', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken // Ensure this token is sent with the request
            },
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
            ui.showSection('profilPage');
            sessionStorage.setItem('isLoggedIn', 'true');
            navbarManager.updateNavbar();
            auth.retrieveInfos()
            .then(data => {
                userInfoDisplayer.updateUI(data);
            })
            .catch(error => console.error('Failed to fetch or display user info:', error));
        })
        .catch(error => console.error('Login error:', error));
    },
    logout: function() {
        fetch('/api/logout/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
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
            navbarManager.updateNavbar();
            ui.showSection('firstpage');
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
            ui.showSection('loginContainer');
            navbarManager.updateNavbar();
        })
        .catch(error => console.error('Registration error:', error));
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
    }
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
