const ui = {
    connected: false,
    toggleSectionVisibility: function(sectionId, isVisible) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.toggle('d-none', !isVisible);
        }
    },

    showOnlyOneSection: function(sectionId, isPopState = false, queryParams = {}) {
        const sections = ['firstPage', 'homepage', 'play', 'tournament', 'settings', 'loginContainer', 'register', 'profilePage', 'endgameStats', 'multiplayer', 'rooms', 'tournamentStage', 'playerStats', 'friends', 'profilePageNoChange'];
        sections.forEach(sec => {
            this.toggleSectionVisibility(sec, sec === sectionId);
        });
        gameSocket.init();
    
        if (!isPopState) {
            let url = '/' + sectionId;
            const queryStrings = Object.keys(queryParams).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`).join('&');
            if (queryStrings) {
                url += `?${queryStrings}`;
            }
            history.pushState({section: sectionId, queryParams: queryParams}, '', url);
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
            { 
                this.showOnlyOneSection('homepage');
            }
            else
                this.showOnlyOneSection('firstPage');
        },
        async 'PLAY'() {
            game.setGameMode('multiplayer');
            settings.populateSettings();
            this.showOnlyOneSection('play');
        },
        async 'playDistantBtn' () {
            game.setGameMode('distant');
            //settings.populateSettings();
            setTimeout(() => {
                gameSocket.sendGameStart();
                console.log('Game started');
            }, 5000);
        },
        async 'SINGLEPLAYER'() {
            game.setGameMode('singlePlayer');
            settings.populateSettings();
            this.showOnlyOneSection('play');
        },
        async 'MULTIPLAYER'() {
            this.showOnlyOneSection('multiplayer');
            settings.populateSettings();
            gameSocket.listRooms();
            setInterval(() => {
                gameSocket.updateRoomList(gameSocket.listRooms());
            }, 5000);
        },
        async 'TOURNAMENT'() {
            this.showOnlyOneSection('tournament');
        },
        async 'SETTINGS'() {
            await settings.populateSettings();
            this.showOnlyOneSection('settings');
        },
        async 'saveSettings'() {
            console.log('FETCH save settings ');
            await settings.saveSettings();
            //await settings.populateSettings();
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
        async 'navFriends'() {
            this.showOnlyOneSection('friends');
            friendsPage.initialize();
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
        async 'nextStageBtn'() {
            //this.showOnlyOneSection('tournamentStage');
            tournament.createTournament();
        },
        async 'invitePlayerTournamentBtn'() {
            tournament.invitePlayers();
        },
        async 'startTournamentBtn'() {
            stats.initStats();
            tournament.generateNextRoundMatches();
        },
        async 'STATISTICS'() {
            this.showOnlyOneSection('playerStats');
            GameStats.init();
        }
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
        this.loadTournamentData();
    },

    loadTournamentData: function() {
        const tournamentId = localStorage.getItem('tournamentId');
        const maxPlayers = localStorage.getItem('maxPlayers');
        const currentParticipants = localStorage.getItem('currentParticipants');
        const participants = localStorage.getItem('participants');
        const initialNumPlayers = localStorage.getItem('initialNumPlayers');
        const currentRound = localStorage.getItem('currentRound');
    
        if (tournamentId && maxPlayers && currentParticipants) {
            tournament.updateParticipantCount(parseInt(currentParticipants, 10), parseInt(maxPlayers, 10));
            tournament.tournamentId = tournamentId;
            tournament.initialNumPlayers = parseInt(initialNumPlayers, 10);
            tournament.currentRound = parseInt(currentRound, 10);
        }
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
