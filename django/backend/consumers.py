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
            await self.send(text_data=json.dumps({'message': f'Joined room {room_name}'}))
            await self.list_users_in_room(data)
        else:
            await self.send(text_data=json.dumps({'error': 'Room does not exist'}))

    async def list_users_in_room(self, data):
        room_name = data['room_name']
        logger.info(f"Listing users for room: {room_name}")
        if not room_name:
            await self.send(text_data=json.dumps({'error': 'Room name is undefined'}))
            return
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
    
    # Assuming this is corrected as you've shown
    async def add_user_to_room(self, room):
        user = await self.get_user_instance()
        print (user)
        if user is not None:
            await database_sync_to_async(room.users.add)(user)

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