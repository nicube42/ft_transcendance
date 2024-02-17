const csrf = {

    fetchToken: function() {
        fetch('/api/csrf_token/')
            .then(response => response.json())
            .then(data => {
                // Insert the CSRF token into the hidden input field
                document.getElementById('csrfTokenInput').value = data.csrfToken;
            })
            .catch(error => console.error('Error fetching CSRF token:', error));
    }
};