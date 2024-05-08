var currentLang = 'en';
function changeLanguage(lang) {
    currentLang = lang;
    document.getElementsByTagName('html')[0].setAttribute('lang', lang);
    updateTexts();
}

function updateTexts() {
    const elementIds = [
        'navHome', 'navSet', 'navLogin', 'navRegister', 'navProfile', 'navLogout',
        'navTournament', 'navStatistics', 'navFriends', 'titleFirstpage', 'titleHomepage',
        'titleTournament', 'titleSettings', 'titleProfile', 'titleStatistics',
        'login_initial', 'register_initial', 'saveSettings', 'cancelLogin', 'cancelRegister', 
        'usernameLabel', 'registerHeader','passwordLabel','loginButton', 'cancelLoginButton', 
        'loginHeader', 'tournamentHeader', 'playerStatisticsTitle', 'totalScore', 'player2_score',
        'player1_score', 'totalScoreTitle', 'gamesPlayedTitle', 'gamesTotalWinsTitle', 'gamesTotalLossesTitle',
        'gamesTotalScoreTitle', 'registerUsernameLabel', 'registerPasswordLabel', 'bioLabel', 'fullnameLabel',
        'navbarDropdown', 'registerSubmitButton', 'cancelRegisterButton', 'gamesPlayedLabel', 'gamesPlayedLabel', 
        'totalLossesLabel', 'totalScoreLabel', 'playerDetailsHeader', 'lastGamesResultsHeader', 'winRateChartHeader',
        'player1Label', 'player2Label', 'ballSpeedLabel', 'paddleSpeedLabel', 'winningScoreLabel', 'totalWinsLabel',
        'previousSettings', 'saveSettings', 'tournamentTreePlaceholder', 'tournamentSetupHeader', 'inviteUsername',
        'invitePlayersHeader', 'startTournamentBtn', 'invitePlayerTournamentBtn', 'matchTreeHeader', 'tournamentHeader', 
        'numPlayersLabel', 'previous_tournament', 'nextStageBtn','winning_scoreLabel', 'endGameUsername2',
        'returnHome', 'playAgain', 'totalBallsLabel', 'gameDurationLabel', 'createRoomBtn', 'roomsHeader',
         'inviteRoomBtn', 'usernameInput', 'quitRoomBtn', 'playDistantBtn', 'invitePlayersLabel', 'settingsHeader',
         'navbarDropdownLanguage', 'Profile Picture', 'registerSubmit', 'pictureLabel', 'friendsHeader', 'playerStatisticsHeader',
         'editProfileButton', 'usernameProfileNoChangeLabel', 'fullnameProfileNoChangeLabel', 'userLogHeader', 'participantCountLabel',
        'refreshFriendsBtn', 'genericErrorModalLabel', 'genericSuccessModalLabel', 'genericErrorModalClose', 'genericSuccessModalClose',
        'gameOverTitle', 'winner_endgameLabel', 'gameBallsLabel','finalScoreLabel' , 'roomUsersConnected',

,    ];

    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const textKey = id.replace(/^nav/, '').toLowerCase();
            const dictionaryValue = langDict[currentLang][textKey];
            if (dictionaryValue) {
                element.textContent = dictionaryValue;
            } else {
                console.error("Dictionary key missing for:", textKey);
            }
        } else {
            console.error("Element not found for ID:", id);
        }
    });

    updateSpecificPageElements();
}

function updateSpecificPageElements() {
    const additionalElements = {
        'SINGLEPLAYER': langDict[currentLang]['single player'],
        'PLAY': langDict[currentLang]['local multiplayer'],
        'MULTIPLAYER': langDict[currentLang]['distant multiplayer'],
        'TOURNAMENT': langDict[currentLang]['tournament'],
        'STATISTICS': langDict[currentLang]['statistics'],
        'SETTINGS': langDict[currentLang]['settings']
    };

    Object.keys(additionalElements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = additionalElements[id];
        } else {
            console.error("Element not found for ID:", id);
        }
    });
}