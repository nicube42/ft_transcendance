document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('profilePicForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent the default form submission
        userInfoDisplayer.fetchAndUpdateUserProfile();
    });
});

const userInfoDisplayer = {
    updateUI: function(data) {
        this.updateProfilePicUI(data.profile_pic_url); // Assuming 'profile_pic_url' is the key in the response JSON
        this.updateUsernameProfile(data);
        this.updateFullNameProfile(data);
    },

    fetchAndUpdateUserProfile: function() {
        // Fetch user profile information (assuming you have an endpoint set up for this)
        fetch('https://localhost:8000/api/user-info/', {
            credentials: 'include', // Include cookies for session management
        })
        .then(response => response.json())
        .then(data => {
            // Assume 'data' contains user information and 'profile_pic_url' for the user's profile picture URL
            this.updateProfilePicUI(data.profile_pic_url || 'http://localhost:8000/media/profile_pics/default.jpg');
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
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Assuming the response includes the updated profile picture URL
            this.updateProfilePicUI(data.profile_pic_url);
            console.log(data);
        })
        .catch(error => {
            console.error('Error:', error);
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
};
