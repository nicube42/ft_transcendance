const ui = {
    hideAll: function() {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            if (!section.classList.contains('hidden')) {
                section.classList.add('hidden');
            }
        });
    },
    showSection: function(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            this.hideAll();
            section.classList.remove('hidden');
        }
    },
    init: function() {
        document.getElementById('navHome').addEventListener('click', () => this.showSection('homepage'));
        document.getElementById('PLAY').addEventListener('click', () => {
            this.showSection('play');
            settings.populateSettings();
        });
        document.getElementById('TOURNAMENT').addEventListener('click', () => this.showSection('tournament'));
        document.getElementById('SETTINGS').addEventListener('click', () => {
            settings.populateSettings();
            this.showSection('settings');
        });
        document.getElementById('saveSettings').addEventListener('click', function(e) {
            e.preventDefault();
            settings.saveSettings();
            settings.populateSettings();
            this.showSection('homepage');
        }.bind(ui));
        document.getElementById('previousSettings').addEventListener('click', function(e) {
            e.preventDefault();
            this.showSection('homepage');
        }.bind(ui));
        document.getElementById('navLogin').addEventListener('click', () => this.showSection('loginContainer'));
        document.getElementById('navRegister').addEventListener('click', () => this.showSection('register'));
        document.getElementById('cancelLogin').addEventListener('click', () => this.showSection('homepage'));
        document.getElementById('cancelRegister').addEventListener('click', () => this.showSection('homepage'));
        document.getElementById('navProfile').addEventListener('click', () => {
            this.showSection('profilPage')
            auth.retrieveInfos()
            .then(data => {
                userInfoDisplayer.updateUI(data);
            })
            .catch(error => console.error('Failed to fetch or display user info:', error));

        });
        document.getElementById('navLogout').addEventListener('click', () => {
            auth.logout();
            this.showSection('homepage');
        });
    }
};

