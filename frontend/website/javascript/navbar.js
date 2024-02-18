const navbarManager = {
    init: function() {
        this.updateNavbar();
    },
    updateNavbar: function() {
        const isAuthenticated = auth.is_connected(); // Ensure auth.is_connected() is defined and returns a boolean

        // Select the dropdown menu and links within the navbar
        const dropdownMenu = document.querySelector('.navbar .dropdown-menu');
        const loginLink = dropdownMenu.querySelector('#navLogin');
        const logoutLink = dropdownMenu.querySelector('#navLogout');
        const registerLink = dropdownMenu.querySelector('#navRegister');
        const profileLink = dropdownMenu.querySelector('#navProfile');

        if (isAuthenticated) {
            loginLink.classList.add('d-none');
            registerLink.classList.add('d-none');
            logoutLink.classList.remove('d-none');
            profileLink.classList.remove('d-none');
            document.getElementById('navSet').classList.remove('d-none');
        } else {
            loginLink.classList.remove('d-none');
            registerLink.classList.remove('d-none');
            logoutLink.classList.add('d-none');
            profileLink.classList.add('d-none');
            document.getElementById('navSet').classList.add('d-none');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    navbarManager.init();
});
