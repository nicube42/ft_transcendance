const userInfoDisplayer = {
    updateUI: function(data) {
        this.updateUsernameProfile(data);
        this.updateFullNameProfile(data);
        this.updateBirthProfile(data);
        this.updateBioProfile(data);
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

    updateBirthProfile: function(data) {
        if (data.date_of_birth) {
            const dobDiv = document.getElementById('birthProfile');
            if (dobDiv) {
                dobDiv.innerHTML = `<p>Date of birth: ${data.date_of_birth}</p>`;
            } else {
                console.error('Error: dobProfile element not found');
            }
        }
    },

    updateBioProfile: function(data) {
        if (data.bio) {
            const bioDiv = document.getElementById('bioProfile');
            if (bioDiv) {
                bioDiv.innerHTML = `<p>Bio: ${data.bio}</p>`;
            } else {
                console.error('Error: bioProfile element not found');
            }
        }
    }
};
