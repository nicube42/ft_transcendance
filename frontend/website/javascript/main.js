document.addEventListener('visibilitychange', () => game.handleVisibilityChange());

document.addEventListener('DOMContentLoaded', function() {
    ui.init();
    navbarManager.init();
    game.init();
});
