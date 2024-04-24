var currentLang = 'en';  // Langue par défaut

function changeLanguage(lang) {
    currentLang = lang;
    updateTexts();  // Met à jour l'interface avec la nouvelle langue
}
// Dans main.js ou languageManager.js
document.addEventListener('DOMContentLoaded', function() {
    changeLanguage('en'); // Ou récupérez la langue stockée localement
});

// update avec le dico chaque mot, exemple qui marchait de base

function updateTexts() {
    document.getElementById('navHome').textContent = langDict[currentLang]['home'];
    document.getElementById('navSet').textContent = langDict[currentLang]['settings'];
    document.getElementById('navLogin').textContent = langDict[currentLang]['login'];
    document.getElementById('navRegister').textContent = langDict[currentLang]['register'];
    document.getElementById('navProfile').textContent = langDict[currentLang]['profile'];
    document.getElementById('navLogout').textContent = langDict[currentLang]['logout'];
    document.getElementById('navTournament').textContent = langDict[currentLang]['tournament'];
    document.getElementById('navStatistics').textContent = langDict[currentLang]['statistics'];
    document.getElementById('navFriends').textContent = langDict[currentLang]['friends'];

    document.getElementById('titleFirstpage').textContent = langDict[currentLang]['welcome'];
    document.getElementById('titleHomepage').textContent = langDict[currentLang]['welcome'];
    document.getElementById('titleTournament').textContent = langDict[currentLang]['tournament'];
    document.getElementById('titleSettings').textContent = langDict[currentLang]['settings'];
    document.getElementById('titleProfile').textContent = langDict[currentLang]['profile'];
    document.getElementById('titleStatistics').textContent = langDict[currentLang]['statistics'];
    document.getElementById('login_initial').textContent = langDict[currentLang]['login'];
    document.getElementById('register_initial').textContent = langDict[currentLang]['register'];
    document.getElementById('saveSettings').textContent = langDict[currentLang]['save'];
    document.getElementById('cancelLogin').textContent = langDict[currentLang]['cancel'];
    document.getElementById('cancelRegister').textContent = langDict[currentLang]['cancel'];

    // Vérifiez l'existence de chaque élément avant d'essayer de mettre à jour pour éviter des erreurs
    if (document.getElementById('someOtherElement')) {
        document.getElementById('someOtherElement').textContent = langDict[currentLang]['someTranslationKey'];
    }
}
