window.addEventListener('beforeunload', function(event) {
    fetch('/api/check-if-user-in-any-room/')
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            return response.text().then(text => { throw new Error(text || 'Problem checking room status'); });
        }
    })
    .then(data => {
        if (gameSocket.currentRoom && game.gameMode === 'distant' && data.status === 'User is in a room') {
            gameSocket.surrenderGame(gameSocket.currentRoom);
            gameSocket.sendGameStop(gameSocket.currentRoom);
            localStorage.setItem('navigateToHome', 'true');
        }
    });
});

window.addEventListener('load', function() {
    if (localStorage.getItem('navigateToHome') === 'true') {
        if (game.playerRole === 'left')
            stats.displayEndGameStatsSurrender(1, 0);
        else
            stats.displayEndGameStatsSurrender(0, 1);
        gameSocket.leaveRoom(gameSocket.currentRoom);
        gameSocket.deleteRoom(gameSocket.currentRoom);
        localStorage.removeItem('navigateToHome');
    
    }
});

window.addEventListener('DOMContentLoaded', function() {
    if (window.location.href === 'https://localhost:4242/profilePageNoChange') {
        userInfoDisplayer.betterUI();
    }
});

const ui = 
{
    connected: false,
    toggleSectionVisibility: function(sectionId, isVisible) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.toggle('d-none', !isVisible);
        }
    },

    showOnlyOneSection: function(sectionId, isPopState = false, queryParams = {}) {
        const sections = ['firstPage', 'homepage', 'play', 'tournament', 'settings', 'loginContainer', 'login42Container', 'register', 'profilePage', 'endgameStats', 'multiplayer', 'rooms', 'tournamentStage', 'playerStats', 'friends', 'profilePageNoChange', 'callback'];
        sections.forEach(sec => {
            this.toggleSectionVisibility(sec, sec === sectionId);
        });
        gameSocket.init()
        ;

        if (game.isPlaying && sectionId !== 'play' && game.gameMode === 'distant'){
            gameSocket.surrenderGame(gameSocket.currentRoom);
        }
        if (sectionId === 'homepage') {
            auth.updateUserTournamentStatus('false');
        }
        if (sectionId === 'play') {
            settings.populateSettings();
        }
    
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
        async 'playDistantBtn' () 
        {
            game.setGameMode('distant');
            fetch(`/api/room/${gameSocket.currentRoom}/user-count/`)
                .then(response => response.json())
                .then(countData => {
                    if (countData.user_count === 2) {
                        gameSocket.sendGameStart();
                    } else {
                        alert(`The room is not full.`);
                    }
                });
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
            await settings.saveSettings();
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
        async 'navLogin42'() {
            window.location.href = 'https://localhost:4242/api/authorize/';
        },
        async 'navRegister'() {
            this.showOnlyOneSection('register');
        },
        async 'navProfile'() {
            userInfoDisplayer.betterUI();
            this.showOnlyOneSection('profilePageNoChange');
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
            if (roomName !== '')
            {
                gameSocket.createRoom(roomName);
                gameSocket.listRooms();
            }
        },
        async 'quitRoomBtn'() {
            if (gameSocket.currentRoom) {
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
            location.reload();
        },
        async 'lang_en'() 
        {
            this.handleLanguageChange('en');
        },
        async 'lang_fr'() {
            this.handleLanguageChange('fr');
        },
        async 'lang_es'() {
            this.handleLanguageChange('es');
        },
    },

    init: function() {
        this.attachEventListeners();
        if (window.location.pathname === '/callback/') {
            auth.callback();
            return;
        }
        this.checkAuthenticationAndInitializePage();

        window.addEventListener('popstate', function(event) {
            if (event.state && event.state.section) {

                ui.showOnlyOneSection(event.state.section, true);
                if (event.state.section === 'callback') {
                    ui.actionHandlers['callback']();
                }
            } else {
                ui.showOnlyOneSection('firstPage', true);
            }
        });

        this.loadTournamentData();
    },

    handleLanguageChange: async function(newLang) {
        changeLanguage(newLang);
    },

    loadTournamentData: function() {
        const tournamentId = localStorage.getItem('tournamentId');
        const maxPlayers = localStorage.getItem('maxPlayers');
        const currentParticipants = localStorage.getItem('currentParticipants');
        const participants = localStorage.getItem('participants');
        const initialNumPlayers = localStorage.getItem('initialNumPlayers');
        const currentRound = localStorage.getItem('currentRound');
        const last_round_participants = localStorage.getItem('last_round_participants');
    
        if (tournamentId && maxPlayers && currentParticipants) {
            tournament.updateParticipantCount(parseInt(currentParticipants, 10), parseInt(maxPlayers, 10));
            tournament.tournamentId = tournamentId;
            tournament.initialNumPlayers = parseInt(initialNumPlayers, 10);
            tournament.currentRound = parseInt(currentRound, 10);
            tournament.participants = JSON.parse(participants);
            tournament.last_round_participants = JSON.parse(last_round_participants);
        }
    },

    checkAuthenticationAndInitializePage: function() {
        auth.checkAuthentication().then((authStatus) => {
            if (authStatus) {
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
