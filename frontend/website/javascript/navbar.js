const navbarManager = {
    init: function() {
        this.updateNavbar();
    },
    updateNavbar: function() {
        // Example criteria: change based on user's authentication status
        const isAuthenticated = auth.is_connected();

        // Select navbar links
        const loginLink = document.getElementById('navLogin');
        const logoutLink = document.getElementById('navLogout');
        const registerLink = document.getElementById('navRegister');
        const profileLink = document.getElementById('navProfile');
        const navSetLink = document.getElementById('navSet');

        if (isAuthenticated) {
            loginLink.style.display = 'none';
            registerLink.style.display = 'none';
            logoutLink.style.display = '';
            profileLink.style.display = '';
            navSetLink.style.display = '';
            navbar.style.display = '';
        } else {
            navbar.style.display = 'none';
        }
    }
};