const navbarManager = {
    updateNavbar: function(authentication) {
        const dropdownMenu = document.querySelector('.navbar .account-dropdown .dropdown-menu');
        const loginLink = dropdownMenu.querySelector('#navLogin');
        const login42Link = dropdownMenu.querySelector('#navLogin42');
        const logoutLink = dropdownMenu.querySelector('#navLogout');
        const registerLink = dropdownMenu.querySelector('#navRegister');
        const profileLink = dropdownMenu.querySelector('#navProfile');
        const friendsLink = dropdownMenu.querySelector('#navFriends');
        const profilePicNav = document.getElementById('profilePicNav');
        const navSet = document.getElementById('navSet');

        if (authentication) {
            loginLink.classList.add('d-none');
            login42Link.classList.add('d-none');
            registerLink.classList.add('d-none');
            logoutLink.classList.remove('d-none');
            profileLink.classList.remove('d-none');
            friendsLink.classList.remove('d-none');
            navSet.classList.remove('d-none');

            auth.retrieveInfos().then(data => {
                if (data && data.username) {
                    fetch(`/api/get_user_profile/${data.username}/`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            console.error('Error fetching profile:', data.error);
                        } else {
                            profilePicNav.src = data.profile_pic_url || '/media/pictures/default.jpg';
                            document.getElementById('csrfTokenProfilePic').value = auth.getCSRFToken();
                        }
                    })
                    .catch(error => console.error('Error fetching profile:', error));
                }
            });
        } else {
            loginLink.classList.remove('d-none');
            login42Link.classList.remove('d-none');
            registerLink.classList.remove('d-none');
            logoutLink.classList.add('d-none');
            profileLink.classList.add('d-none');
            friendsLink.classList.add('d-none');
            navSet.classList.add('d-none');
            profilePicNav.src = '/media/pictures/default.jpg';
        }
    }
};
