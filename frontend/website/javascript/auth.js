const auth = {
    login: function() {
        const formData = {
            username: document.getElementById('id_username').value,
            password: document.getElementById('id_password').value
        };
        fetch('/api/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Login success:', data);
            // Redirect or update UI here
        })
        .catch(error => console.error('Login error:', error));
    },
    register: function() {
        const formData = {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value
        };
        fetch('/api/register/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Registration success:', data);
            // Redirect or update UI here
        })
        .catch(error => console.error('Registration error:', error));
    }
};

// Attach events for login and registration forms
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    auth.login();
});

document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    auth.register();
});
