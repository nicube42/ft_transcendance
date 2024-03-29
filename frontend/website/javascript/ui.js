const ui = {
    connected: false,
    toggleSectionVisibility: function(sectionId, isVisible) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.toggle('d-none', !isVisible);
        }
    },

    showOnlyOneSection: function(sectionId, isPopState = false) {
        const sections = ['firstPage', 'homepage', 'play', 'tournament', 'settings', 'loginContainer', 'register', 'profilePage', 'endgameStats', 'multiplayer', 'rooms'];
        sections.forEach(sec => {
            this.toggleSectionVisibility(sec, sec === sectionId);
        });
    
        if (!isPopState) {
            const url = '/' + sectionId;
            history.pushState({section: sectionId}, '', url);
        }
    
        game.handleVisibilityChange?.();
    },           

    isSectionVisible: function(sectionId) {
        const section = document.getElementById(sectionId);
        return section && !section.classList.contains('d-none');
    },   

    attachEventListeners: function() {
        document.body.addEventListener('click', (e) => {
            let target = e.target;
    
            if (target.matches('.btn-close[data-room-name]')) {
                e.preventDefault();
                const roomName = target.getAttribute('data-room-name');
                this.handleDeleteRoom(roomName).catch(console.error);
                return;
            }
    
            while (target !== document.body && !target.id) {
                target = target.parentNode;
            }
            if (this.actionHandlers[target.id]) {
                e.preventDefault();
                this.actionHandlers[target.id].call(this, e).catch(console.error);
            }
        });
    },

    handleDeleteRoom: async function(roomName) {
        console.log(`Deleting room: ${roomName}`);
        gameSocket.deleteRoom(roomName);
        gameSocket.listRooms();
    },

    actionHandlers: {
        async 'navHome'() {
            if (this.connected)
                this.showOnlyOneSection('homepage');
            else
                this.showOnlyOneSection('firstPage');
        },
        async 'PLAY'() {
            game.setGameMode('multiplayer');
            this.showOnlyOneSection('play');
        },
        async 'playDistantBtn' () {
            game.setGameMode('distant');
            this.showOnlyOneSection('play');
            gameSocket.sendGameStart();
        },
        async 'SINGLEPLAYER'() {
            game.setGameMode('singlePlayer');
            this.showOnlyOneSection('play');
        },
        async 'MULTIPLAYER'() {
            this.showOnlyOneSection('multiplayer');
            gameSocket.listRooms();
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
            if (this.connected)
                this.showOnlyOneSection('homepage');
            else
                this.showOnlyOneSection('firstPage');
        },
        async 'cancelRegister'() {
            if (this.connected)
                this.showOnlyOneSection('homepage');
            else
                this.showOnlyOneSection('firstPage');
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
            if (this.connected)
                this.showOnlyOneSection('homepage');
            else
                this.showOnlyOneSection('firstPage');
        },
        async 'playAgain'() {
            this.showOnlyOneSection('play');
            await settings.populateSettings();
        },
        async 'createRoomBtn' () {
            const roomName = document.querySelector('#roomNameInput').value;
            gameSocket.createRoom(roomName);
            gameSocket.listRooms();
        },
        async 'joinRoomBtn' () {
            const roomName = document.querySelector('#roomNameInput').value;
            gameSocket.joinRoom(roomName);
            gameSocket.listRooms();
        },
        async 'quitRoomBtn'() {
            if (gameSocket.currentRoom) {
                console.log(`Leaving room: ${gameSocket.currentRoom}`);
                gameSocket.leaveRoom(gameSocket.currentRoom);
                setTimeout(() => {
                    gameSocket.listUsersInRoom(gameSocket.currentRoom);
                    gameSocket.currentRoom = null;
                }, 500);
            } else {
                console.error('Attempted to leave a room, but no current room is set.');
            }
        },
        
    },

    init: function() {
        this.attachEventListeners();
        this.checkAuthenticationAndInitializePage();
        window.addEventListener('popstate', function(event) {
            if (event.state && event.state.section) {
                ui.showOnlyOneSection(event.state.section, true);
            } else {
                ui.showOnlyOneSection('firstPage', true);
            }
        });
    },

    checkAuthenticationAndInitializePage: function() {
        auth.checkAuthentication().then((authStatus) => {
            if (authStatus.isAuthenticated) {
                this.connected = true;
                navbarManager.updateNavbar(this.connected);
                const path = window.location.pathname.substring(1) || 'homepage';
                this.showOnlyOneSection(path, true);
            } else {
                this.connected = false;
                navbarManager.updateNavbar(this.connected);
                this.showOnlyOneSection('firstPage', true);
            }
        }).catch((error) => {
            console.error('Error checking authentication status:', error);
            this.showOnlyOneSection('firstPage', true);
        });
    },
};
