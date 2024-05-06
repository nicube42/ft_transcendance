document.addEventListener('DOMContentLoaded', async function() {
    const data = await auth.retrieveInfos();
    userInfoDisplayer.updateUI(data);
});

document.getElementById('profilePicForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.querySelector('#input-username').value;
    const formData = new FormData(this);
    formData.append('username', username);  // Assuming backend will handle this too.
    // First, check if the username is available
    try {
        const checkUserResponse = await fetch('/api/check_user/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': auth.getCSRFToken('csrftoken'),
            },
            body: JSON.stringify({ username: username })
        });

        const userData = await checkUserResponse.json();
        if (!checkUserResponse.ok) {
            if (userData.error)
                throw new Error(userData.error);
            throw new Error('Network response was not ok');
        }

        if (userData.exists) {
            auth.registerErrorModal('Username already exists, choose a different one.');
            return;
        }
        if (username !== '')
            userInfoDisplayer.renameUser(username);


        console.log('Profile picture form data:', formData.get('profile_pic').name);
        if (formData.get('profile_pic').name === '')
            return;

        // If the username does not exist, proceed with updating the profile picture
        const updatePicResponse = await fetch('api/change-profile-pic/', {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });

        const updateData = await updatePicResponse.json();
        if (!updatePicResponse.ok) {
            if (updateData.error)
                throw new Error(updateData.error);
            throw new Error('Failed to update profile picture: ' + JSON.stringify(updateData.error));
        }

        if(updateData.message) {
            auth.registerErrorModal('Profile picture updated successfully.');
            document.getElementById('usernameProfile').textContent = username;
            const newPicURL = URL.createObjectURL(document.querySelector('#profile_pic').files[0]);
            document.getElementById('profilePic').src = newPicURL;
        } else {
            alert('Error updating profile picture: ' + JSON.stringify(updateData.error));
        }

    } catch (error) {
        console.error('Error:', error);
        auth.registerErrorModal(error);
    }
});

const userInfoDisplayer = {
    updateUI: function(data) {
        this.updateProfilePicUI(data.profile_pic_url); // Assuming 'profile_pic_url' is the key in the response JSON
        this.updateUsernameProfile(data);
        this.updateFullNameProfile(data);
        userInfoDisplayer.fetchAndUpdateUserProfile();
    },

    fetchAndUpdateUserProfile: function() {
        // Fetch user profile information (assuming you have an endpoint set up for this)
        fetch('/api/user-info/', {
            credentials: 'include', // Include cookies for session management
        })
        .then(response => response.json())
        .then(data => {
            // Assume 'data' contains user information and 'profile_pic_url' for the user's profile picture URL
            this.updateProfilePicUI(data.profile_pic_url || '/media/pictures/default.jpg'); //todo change this
            // Update other parts of the UI as necessary
        })
        .catch(error => console.error('Error:', error));
    },

    updateProfilePicUI: function(profilePicUrl) {
        const profilePicImg = document.getElementById('profilePic');
        if (profilePicImg) {
            profilePicImg.src = profilePicUrl;
        } else {
            console.error('Error: profilePic element not found');
        }
    },

    updateProfilePic: function() {
        const form = document.getElementById('profilePicForm');
        const formData = new FormData(form);
        fetch('/update-profile-pic/', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: formData,
        })
        .then(response => {
            if (!response.ok && response.status === 500) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            this.updateProfilePicUI(data.profile_pic_url);
            console.log(data);
        })
        .catch(error => {
            auth.registerErrorModal(error);
            console.error('Error updating profile picture:', error);
        });
    },

    updateUsernameProfile: function(data) {
        const userInfoDiv = document.getElementById('usernameProfile');
        if (userInfoDiv) {
            userInfoDiv.innerHTML = `<p>Username: ${data.username}</p>`;
        } else {
            console.error('Error: usernameProfile element not found');
        }
    },

    updateFullNameProfile: function(data) {
        if (data.fullname) {
            const fullNameDiv = document.getElementById('fullnameProfile');
            if (fullNameDiv) {
                fullNameDiv.innerHTML = `<p>Full name: ${data.fullname}</p>`;
            } else {
                console.error('Error: fullNameProfile element not found');
            }
        }
    },

    renameUser: function(username) {

        fetch('/api/rename-user/', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'X-CSRFToken': auth.getCSRFToken('csrftoken'),
            },
            body: JSON.stringify({username: username}),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Assuming the response includes the updated profile picture URL
            try {
                const data = auth.retrieveInfos();
                userInfoDisplayer.updateUI(data);
                ui.showOnlyOneSection('profilePage');
            } catch (error) {
                console.error('Failed to fetch or display user info:', error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    },
    betterUI: async function() {
        try {
            const userInfo = await auth.retrieveInfos();
            
            friendsPage.showUserProfile(userInfo.username);

            document.getElementById('editProfileButton').addEventListener('click', () => {
                ui.showOnlyOneSection('profilePage');
                try {
                    auth.retrieveInfos().then(data => {
                        userInfoDisplayer.updateUI(data);
                    });
                } catch (error) {
                    console.error('Failed to fetch or display user info:', error);
                }
            });
        } catch (error) {
            console.error('Failed to fetch or display user info:', error);
        }
    },
};
