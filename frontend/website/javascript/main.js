document.addEventListener('visibilitychange', () => game.handleVisibilityChange());

document.addEventListener('DOMContentLoaded', function() {
    ui.init();
    //websocket.initialize();
    game.init();
});
