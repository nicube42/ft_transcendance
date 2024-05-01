const navbarManager = {
    updateNavbar: function(authentication) {
        console.log("updateNavbar called with after", authentication);

        const dropdownMenu = document.querySelector('.navbar .dropdown-menu');
        const loginLink = dropdownMenu.querySelector('#navLogin');
        const login42Link = dropdownMenu.querySelector('#navLogin42');
        const logoutLink = dropdownMenu.querySelector('#navLogout');
        const registerLink = dropdownMenu.querySelector('#navRegister');
        const profileLink = dropdownMenu.querySelector('#navProfile');
        const friendsLink = dropdownMenu.querySelector('#navFriends');

        if (authentication) {
            loginLink.classList.add('d-none');
            login42Link.classList.add('d-none');
            registerLink.classList.add('d-none');
            logoutLink.classList.remove('d-none');
            profileLink.classList.remove('d-none');
            friendsLink.classList.remove('d-none');
            document.getElementById('navSet').classList.remove('d-none');
        } else {
            loginLink.classList.remove('d-none');
            login42Link.classList.remove('d-none');
            registerLink.classList.remove('d-none');
            logoutLink.classList.add('d-none');
            profileLink.classList.add('d-none');
            friendsLink.classList.add('d-none');
            document.getElementById('navSet').classList.add('d-none');
        }
    }
};