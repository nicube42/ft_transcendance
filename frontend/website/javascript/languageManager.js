var currentLang = 'en';
function changeLanguage(lang) {
    currentLang = lang;
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
    ];

    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const textKey = id.replace(/^nav/, '').toLowerCase();
            const dictionaryValue = langDict[currentLang][textKey];
            if (dictionaryValue) {
                element.textContent = dictionaryValue;
            } else {
            }
        } else {
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
        }
    });
}