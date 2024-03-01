from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync
from .models import Room
from django.contrib.auth import get_user_model
import json
from django.contrib.sessions.models import Session
import logging
from django.db.models import Case, When, Value, BooleanField

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
            return
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
        elif action == 'delete_room':
            await self.delete_room(text_data_json)

    async def create_room(self, data):
        room_name = data['room_name']
        user = self.scope['user']
        if user.is_anonymous:
            await self.send_message_safe(json.dumps({'error': 'Authentication required to create room'}))
            return
        room, created = await self.get_or_create_room(name=room_name, user=user)
        if created:
            await self.send_message_safe(json.dumps({'message': f'Room {room_name} created'}))
        else:
            await self.send_message_safe(json.dumps({'error': 'Room already exists'}))

    async def join_room(self, data):
        room_name = data['room_name']
        room = await self.get_room_by_name(room_name)
        if room:
            await self.add_user_to_room(room)
            user_count = await self.get_user_count(room)
            player_position = "left" if user_count == 1 else "right"
            await self.channel_layer.group_add(
                room_name,
                self.channel_name
            )
            await self.send_message_safe(json.dumps({'position': player_position}))
            await self.list_users_in_room(data)
            await self.channel_layer.group_send(
                room_name,
                {
                    "type": "player.joined",
                    "position": player_position,
                    "player": self.scope["user"].username,
                    "user_count": user_count,
                }
            )
            await self.send_message_safe(json.dumps({
                'action': 'assign_role',
                'role': player_position  # 'left' or 'right'
            }))
        else:
            await self.send_message_safe(json.dumps({'error': 'Room does not exist'}))

    async def delete_room(self, data):
        room_name = data['room_name']
        user = self.scope['user']
        room = await self.get_room_by_name(room_name)

        if room:
            is_admin = await self.is_user_admin_of_room(user, room)
            if is_admin:
                deleted = await self.remove_room_by_name(room_name)
                if deleted:
                    await self.send_message_safe(json.dumps({'message': f'Room {room_name} deleted successfully'}))
                else:
                    await self.send_message_safe(json.dumps({'error': 'Failed to delete room'}))
            else:
                await self.send_message_safe(json.dumps({'error': 'Only the room admin can delete the room'}))
        else:
            await self.send_message_safe(json.dumps({'error': 'Room does not exist'}))

    @database_sync_to_async
    def remove_room_by_name(self, name):
        try:
            room = Room.objects.get(name=name)
            room.delete()
            return True
        except Room.DoesNotExist:
            return False


    async def player_joined(self, event):
        if self.scope["user"].username != event["player"]:
            await self.send_message_safe(json.dumps({
                "type": "player.joined",
                "position": event["position"],
                "player": event["player"],
                "user_count": event["user_count"],
            }))

    @database_sync_to_async
    def get_user_count(self, room):
        return room.users.count()

    async def list_users_in_room(self, data):
        room_name = data.get('room_name')
        if not room_name:
            await self.send_message_safe(json.dumps({'error': 'Room name is required'}))
            return
        logger.info(f"Listing users for room: {room_name}")
        room = await self.get_room_by_name(room_name)
        if room:
            user_objects = await self.get_users_in_room(room)
            users = [user.username for user in user_objects]
            await self.send_message_safe(json.dumps({
                'action': 'list_users',
                'room_name': room_name,
                'users': users
            }))
        else:
            await self.send_message_safe(json.dumps({
                'error': 'Room does not exist',
                'room_name': room_name
            }))


    @database_sync_to_async
    def get_rooms_data(self, user):
        rooms = Room.objects.annotate(is_admin=Case(
            When(admin=user, then=Value(True)),
            default=Value(False),
            output_field=BooleanField()
        )).values('name', 'is_admin')
        return list(rooms)

    async def list_rooms(self):
        user = self.scope['user']
        rooms_data = await self.get_rooms_data(user)
        await self.send_message_safe(json.dumps({
            'action': 'list_rooms',
            'rooms': rooms_data
        }))



    @database_sync_to_async
    def get_rooms(self):
        user = self.user
        rooms = Room.objects.annotate(
            is_admin=Case(
                When(admin=user, then=Value(True)),
                default=Value(False),
                output_field=BooleanField()
            )
        ).values('name', 'is_admin')
        return list(rooms)

    @database_sync_to_async
    def get_or_create_room(self, name, user):
        room, created = Room.objects.get_or_create(name=name, defaults={'admin': user})
        return room, created

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
            await self.send_message_safe(json.dumps({'error': 'Room name is required to leave'}))
            return
        room = await self.get_room_by_name(room_name)
        if room:
            await self.remove_user_from_room(room)
            await self.send_message_safe(json.dumps({'message': f'Left room {room_name}'}))
            await self.list_users_in_room(data)
        else:
            await self.send_message_safe(json.dumps({'error': 'Room does not exist'}))

    
    async def remove_user_from_room(self, room):
        user = await self.get_user_instance()
        if user is not None:
            await database_sync_to_async(room.users.remove)(user)
            logger.info(f"User {user.username} removed from room {room.name}")
            await self.channel_layer.group_discard(room.name, self.channel_name)

    async def add_user_to_room(self, room):
        user = await self.get_user_instance()
        print (user)
        if user is not None:
            await database_sync_to_async(room.users.add)(user)
            await self.channel_layer.group_add(room.name, self.channel_name)

    async def leave_all_rooms(self):
        user = await self.get_user_instance()
        if user is not None:
            rooms = await self._get_user_rooms(user)
            for room in rooms:
                await database_sync_to_async(room.users.remove)(user)
    
    @database_sync_to_async
    def _get_user_rooms(self, user):
        return list(user.rooms.all())

    @database_sync_to_async
    def get_users_in_room(self, room):
        print(room.users.all())
        return list(room.users.all())

    @database_sync_to_async
    def is_user_admin_of_room(self, user, room):
        """Check if the given user is the admin of the specified room."""
        return room.admin == user
    
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
        role = data['role']

        await self.channel_layer.group_send(
            room_name,
            {
                'type': 'broadcast_paddle_move',
                'direction': direction,
                'role': role,
                'player': self.scope["user"].username,
                'sender_channel_name': self.channel_name,
            }
        )


    async def broadcast_paddle_move(self, event):
        await self.send_message_safe(json.dumps({
            'action': 'paddle_move',
            'direction': event['direction'],
            'role': event['role'],
            'player': event['player']
        }))

        
    async def update_ball_state(self, data):
        room_name = data['room_name']
        logging.info(f"Received data for ball state update: {data}")

        ballPosX = data.get('ballPosX')
        ballPosY = data.get('ballPosY')
        ballSpeedX = data.get('ballSpeedX')
        ballSpeedY = data.get('ballSpeedY')

        if ballPosX is None or ballPosY is None or ballSpeedX is None or ballSpeedY is None:
            logging.error("Missing one or more required keys in the data for ball state update.")
            return

        ball_state = {
            'ballPosX': ballPosX,
            'ballPosY': ballPosY,
            'ballSpeedX': ballSpeedX,
            'ballSpeedY': ballSpeedY,
        }

        await self.channel_layer.group_send(
            room_name,
            {
                'type': 'broadcast_ball_state',
                'ball_state': ball_state,
                'sender_channel_name': self.channel_name,
            }
        )


    async def broadcast_ball_state(self, event):
        if event.get('sender_channel_name') != self.channel_name:
            await self.send_message_safe(json.dumps({
                'action': 'update_ball_state',
                'ball_state': event['ball_state'],
            }))


    async def start_game(self, data):
        room_name = data['room_name']
        await self.channel_layer.group_send(
            room_name,
            {
                'type': 'game_start',
                'message': 'start_game',
            }
        )


    async def game_start(self, event):
        await self.send_message_safe(json.dumps({
            'action': 'start_game',
        }))

    async def send_message_safe(self, message):
        if not self.user.is_anonymous:
            if not isinstance(message, str):
                message = json.dumps(message)
            await self.send(text_data=message)
        else:
            logger.info("Attempted to send message to anonymous user, action skipped.")
