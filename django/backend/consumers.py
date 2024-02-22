from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync
from .models import Room
from django.contrib.auth import get_user_model
import json
from django.contrib.sessions.models import Session
import logging

logger = logging.getLogger(__name__) 

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print(self.scope)
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            session_key = self.scope["cookies"].get("sessionid", None)
            if session_key:
                user = await self.get_user_from_session(session_key)
                if user:
                    self.user = user
                    logger.info(f"Authenticated user from session: {user}")
                else:
                    logger.info("No user found in session.")
            else:
                logger.info("No session ID provided.")
        logger.debug(f"User: {self.user}, Session Key: {self.scope['cookies'].get('sessionid', None)}")
        await self.accept()

    @database_sync_to_async
    def get_user_from_session(self, session_key):
        try:
            session = Session.objects.get(session_key=session_key)
            uid = session.get_decoded().get('_auth_user_id')
            user = get_user_model().objects.get(id=uid)
            return user
        except (Session.DoesNotExist, get_user_model().DoesNotExist):
            return None

    async def disconnect(self, close_code):
        await self.leave_all_rooms()
        pass

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json.get('action')

        if action == 'create_room':
            await self.create_room(text_data_json)
        elif action == 'join_room':
            await self.join_room(text_data_json)
        elif action == 'list_rooms':
            await self.list_rooms()
        elif action == 'list_users_in_room':
            await self.list_users_in_room(text_data_json)
        elif action == 'leaveRoom':
            await self.leaveRoom(text_data_json)
        elif action == 'paddle_move':
            await self.handle_paddle_move(text_data_json)
        elif action == 'start_game':
            await self.start_game(text_data_json)
        elif action == 'game_start':
            await self.game_start()
        elif action == 'update_ball_state':
            await self.update_ball_state(text_data_json)

    async def create_room(self, data):
        room_name = data['room_name']
        room, created = await self.get_or_create_room(name=room_name)
        if created:
            await self.send(text_data=json.dumps({'message': f'Room {room_name} created'}))
        else:
            await self.send(text_data=json.dumps({'error': 'Room already exists'}))

    async def join_room(self, data):
        room_name = data['room_name']
        room = await self.get_room_by_name(room_name)
        if room:
            await self.add_user_to_room(room)
            user_count = await self.get_user_count(room)  # Use the async wrapper here
            player_position = "left" if user_count == 1 else "right"
            await self.channel_layer.group_add(
                room_name,
                self.channel_name
            )
            await self.send(text_data=json.dumps({'position': player_position}))
            await self.list_users_in_room(data)
            # Broadcast to the room that a new player has joined
            await self.channel_layer.group_send(
                room_name,
                {
                    "type": "player.joined",
                    "position": player_position,
                    "player": self.scope["user"].username,
                    "user_count": user_count,
                }
            )
            await self.send(text_data=json.dumps({
                'action': 'assign_role',
                'role': player_position  # 'left' or 'right'
            }))
        else:
            await self.send(text_data=json.dumps({'error': 'Room does not exist'}))

    async def player_joined(self, event):
        # Send a message to all users in the room except the sender
        if self.scope["user"].username != event["player"]:
            await self.send(text_data=json.dumps({
                "type": "player.joined",
                "position": event["position"],
                "player": event["player"],
                "user_count": event["user_count"],
            }))

    # Add a new async function to get user count
    @database_sync_to_async
    def get_user_count(self, room):
        return room.users.count()

    async def list_users_in_room(self, data):
        room_name = data.get('room_name')  # Use .get() to safely access the key
        if not room_name:  # Check if room_name is None or empty
            await self.send(text_data=json.dumps({'error': 'Room name is required'}))
            return
        logger.info(f"Listing users for room: {room_name}")
        room = await self.get_room_by_name(room_name)
        if room:
            user_objects = await self.get_users_in_room(room)
            users = [user.username for user in user_objects]  # Serialize user data here
            await self.send(text_data=json.dumps({
                'action': 'list_users',
                'room_name': room_name,
                'users': users
            }))
        else:
            await self.send(text_data=json.dumps({
                'error': 'Room does not exist',
                'room_name': room_name
            }))


    async def list_rooms(self):
            rooms = await self.get_rooms()
            await self.send(text_data=json.dumps({
                'action': 'list_rooms',
                'rooms': [{'name': room.name} for room in rooms]
            }))


    @database_sync_to_async
    def get_or_create_room(self, name):
        return Room.objects.get_or_create(name=name)

    @database_sync_to_async
    def get_room_by_name(self, name):
        try:
            return Room.objects.get(name=name)
        except Room.DoesNotExist:
            return None

    @database_sync_to_async
    def get_rooms(self):
        return list(Room.objects.all())
    
    async def leaveRoom(self, data):
        logger.info(f"Attempting to leave room with data: {data}")
        room_name = data.get('room_name')
        if not room_name:
            await self.send(text_data=json.dumps({'error': 'Room name is required to leave'}))
            return
        room = await self.get_room_by_name(room_name)
        if room:
            await self.remove_user_from_room(room)
            await self.send(text_data=json.dumps({'message': f'Left room {room_name}'}))
            await self.list_users_in_room(data)
        else:
            await self.send(text_data=json.dumps({'error': 'Room does not exist'}))

    
    async def remove_user_from_room(self, room):
        user = await self.get_user_instance()
        if user is not None:
            # Remove the user from the room
            await database_sync_to_async(room.users.remove)(user)
            logger.info(f"User {user.username} removed from room {room.name}")
            await self.channel_layer.group_discard(room.name, self.channel_name)


    # Assuming this is corrected as you've shown
    async def add_user_to_room(self, room):
        user = await self.get_user_instance()
        print (user)
        if user is not None:
            await database_sync_to_async(room.users.add)(user)
            await self.channel_layer.group_add(room.name, self.channel_name)

    # Correct handling for leaving all rooms
    async def leave_all_rooms(self):
        user = await self.get_user_instance()
        if user is not None:
            rooms = await self._get_user_rooms(user)
            for room in rooms:
                await database_sync_to_async(room.users.remove)(user)
    
    # Helper method to get user's rooms
    @database_sync_to_async
    def _get_user_rooms(self, user):
        return list(user.rooms.all())

    @database_sync_to_async
    def get_users_in_room(self, room):
        print(room.users.all())
        return list(room.users.all())
    
    async def get_user_instance(self):
        user_id = self.scope["user"].id
        if user_id is None:
            return None
        user = await database_sync_to_async(get_user_model().objects.get)(id=user_id)
        return user

    @database_sync_to_async
    def get_session_data(self, session_key):
        try:
            session = Session.objects.get(session_key=session_key)
            return session.get_decoded()
        except Session.DoesNotExist:
            return None
            
    async def handle_paddle_move(self, data):
        room_name = data['room_name']
        direction = data['direction']
        role = data['role']  # 'left' or 'right', based on the player's role

        # Broadcast the paddle move, including the sender's channel name to exclude them
        await self.channel_layer.group_send(
            room_name,
            {
                'type': 'broadcast_paddle_move',
                'direction': direction,
                'role': role,
                'player': self.scope["user"].username,
                'sender_channel_name': self.channel_name,  # Include the sender's channel name
            }
        )


    async def broadcast_paddle_move(self, event):
        # Send the paddle move event to WebSocket, including the player's username
        await self.send(text_data=json.dumps({
            'action': 'paddle_move',
            'direction': event['direction'],
            'role': event['role'],  # Make sure to include the role in the response
            'player': event['player']  # Now this line should not cause a KeyError
        }))

        
    async def update_ball_state(self, data):
        room_name = data['room_name']
        # Log the received data for debugging
        logging.info(f"Received data for ball state update: {data}")

        # Safely access the keys using the get method
        ballPosX = data.get('ballPosX')
        ballPosY = data.get('ballPosY')
        ballSpeedX = data.get('ballSpeedX')
        ballSpeedY = data.get('ballSpeedY')

        # Check if any of the required keys are missing
        if ballPosX is None or ballPosY is None or ballSpeedX is None or ballSpeedY is None:
            logging.error("Missing one or more required keys in the data for ball state update.")
            return

        # Now define the ball_state dictionary correctly before using it
        ball_state = {
            'ballPosX': ballPosX,
            'ballPosY': ballPosY,
            'ballSpeedX': ballSpeedX,
            'ballSpeedY': ballSpeedY,
        }

        # Broadcast the ball state update, including the sender's channel name to exclude them
        await self.channel_layer.group_send(
            room_name,
            {
                'type': 'broadcast_ball_state',
                'ball_state': ball_state,
                'sender_channel_name': self.channel_name,  # Include the sender's channel name
            }
        )


    async def broadcast_ball_state(self, event):
        # Exclude the sender by checking if the event's 'sender_channel_name' matches the current channel name
        if event.get('sender_channel_name') != self.channel_name:
            # The message is not sent back to the sender
            await self.send(text_data=json.dumps({
                'action': 'update_ball_state',
                'ball_state': event['ball_state'],
            }))


    async def start_game(self, data):
        room_name = data['room_name']
        # Broadcast a message to the room to start the game
        await self.channel_layer.group_send(
            room_name,
            {
                'type': 'game_start',
                'message': 'start_game',
            }
        )


    async def game_start(self, event):
        # Send a message to WebSocket clients
        await self.send(text_data=json.dumps({
            'action': 'start_game',
        }))
