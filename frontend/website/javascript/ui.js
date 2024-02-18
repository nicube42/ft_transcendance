const ui = {
    toggleSectionVisibility: function(sectionId, isVisible) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.toggle('d-none', !isVisible);
        }
    },

    showOnlyOneSection: function(sectionId) {
        const sections = ['firstPage', 'homepage', 'play', 'tournament', 'settings', 'loginContainer', 'register', 'profilePage', 'endgameStats'];
        sections.forEach(sec => {
            this.toggleSectionVisibility(sec, sec === sectionId);
        });
    },

    initializePage: async function() {
        try {
            const isConnected = await auth.is_connected();
            this.showOnlyOneSection(isConnected ? 'homepage' : 'firstPage');
        } catch (error) {
            console.error('Error initializing page:', error);
        }
    },

    attachEventListeners: function() {
        document.body.addEventListener('click', (e) => {
            let target = e.target;
            // Find the nearest ancestor with an ID or the element itself
            while (target !== document.body && !target.id) {
                target = target.parentNode;
            }
            // Prevent default action only if a handler is defined
            if (this.actionHandlers[target.id]) {
                e.preventDefault();
                this.actionHandlers[target.id].call(this, e).catch(console.error);
            }
        });
    },

    actionHandlers: {
        async 'navHome'() {
            if (auth.is_connected())
                this.showOnlyOneSection('homepage');
            else
                this.showOnlyOneSection('firstPage');
        },
        async 'PLAY'() {
            this.showOnlyOneSection('play');
            await settings.populateSettings();
        },
        async 'TOURNAMENT'() {
            this.showOnlyOneSection('tournament');
        },
        async 'SETTINGS'() {
            await settings.populateSettings();
            this.showOnlyOneSection('settings');
        },
        async 'saveSettings'() {
            await settings.saveSettings();
            await settings.populateSettings();
            this.showOnlyOneSection('homepage');
        },
        async 'previousSettings'() {
            this.showOnlyOneSection('homepage');
        },
        async 'cancelLogin'() {
            this.showOnlyOneSection('homepage');
        },
        async 'cancelRegister'() {
            this.showOnlyOneSection('homepage');
        },
        async 'navLogin'() {
            this.showOnlyOneSection('loginContainer');
        },
        async 'navRegister'() {
            this.showOnlyOneSection('register');
        },
        async 'navProfile'() {
            this.showOnlyOneSection('profilePage');
            try {
                const data = await auth.retrieveInfos();
                userInfoDisplayer.updateUI(data);
            } catch (error) {
                console.error('Failed to fetch or display user info:', error);
            }
        },
        async 'navLogout'() {
            await auth.logout();
            this.showOnlyOneSection('firstpage');
        },
        async 'login_initial'() {
            this.showOnlyOneSection('loginContainer');
        },
        async 'register_initial'() {
            this.showOnlyOneSection('register');
        },
        async 'navSet'() {
            await settings.saveSettings();
            await settings.populateSettings();
            this.showOnlyOneSection('settings');
        },
        async 'navBrand' () {
            if (auth.is_connected())
                this.showOnlyOneSection('homepage');
            else
                this.showOnlyOneSection('firstPage');
        }
    },

    init: function() {
        this.attachEventListeners();
        this.initializePage();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ui.init();
});
