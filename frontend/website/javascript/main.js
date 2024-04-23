document.addEventListener('visibilitychange', () => game.handleVisibilityChange());

document.addEventListener('DOMContentLoaded', function() {
    ui.init();
    game.init();
    websocket.initialize();
});
