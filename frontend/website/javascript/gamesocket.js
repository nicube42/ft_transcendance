var gameSocket = {
    socket: null,

    init: function() {
        const backendHost = 'localhost:8000';
        const wsScheme = window.location.protocol === "https:" ? "wss://" : "ws://";
        this.socket = new WebSocket(wsScheme + backendHost + '/ws/game/');

        // Event listeners are set up once during initialization
        this.socket.addEventListener('open', (event) => {
            console.log("Connected to WebSocket");
            this.listRooms(); // Automatically list rooms upon connection
        });

        this.socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            console.log("Message from server ", data);
        
            if (data.action === 'list_rooms') {
                this.updateRoomList(data.rooms);
            }
        });

        this.socket.addEventListener('close', (event) => {
            console.log("Disconnected from WebSocket");
        });
    },

    // Send a message to create a room
    createRoom: function(roomName) {
        this.sendMessage({'action': 'create_room', 'room_name': roomName});
    },

    // Send a message to join a room
    joinRoom: function(roomName) {
        this.sendMessage({'action': 'join_room', 'room_name': roomName});
    },

    // Leave a room
    leaveRoom: function(roomName) {
        this.sendMessage({'action': 'leave_room', 'room_name': roomName});
    },

    listRooms: function() {
        this.sendMessage({'action': 'list_rooms'});
    },

    updateRoomList: function(rooms) {
        const roomListDiv = document.getElementById('roomList');
        roomListDiv.innerHTML = ''; // Clear current list
        if (ui.isSectionVisible('multiplayer')) {        
            rooms.forEach((room) => { // Assuming room is an object with a property 'name'
                const roomElement = document.createElement('div');
                roomElement.className = 'room-item';
                roomElement.textContent = room.name; // Access the 'name' property of the room object
                roomElement.style.color = 'white';
                roomElement.addEventListener('click', () => {
                    this.joinRoom(room.name); // Make sure to pass the room's name here as well
                });
        
                roomListDiv.appendChild(roomElement);
            });
        }
    },

    sendMessage: function(message) {
        this.socket.send(JSON.stringify(message));
    },
    
};

// Once the page is fully loaded, initialize the WebSocket connection
window.addEventListener('load', function() {
    gameSocket.init();
});
