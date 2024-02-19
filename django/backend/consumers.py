from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync
from .models import Room
import json

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        # Handle disconnect logic, such as removing the user from rooms
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

    async def create_room(self, data):
        room_name = data['room_name']
        room, created = await self.get_or_create_room(name=room_name)
        if created:
            await self.send(text_data=json.dumps({'message': f'Room {room_name} created'}))
        else:
            await self.send(text_data=json.dumps({'error': 'Room already exists'}))

    @database_sync_to_async
    def get_or_create_room(self, name):
        return Room.objects.get_or_create(name=name)

    async def join_room(self, data):
        room_name = data['room_name']
        room = await self.get_room_by_name(room_name)
        if room:
            # Logic to add the user to the room, etc.
            await self.send(text_data=json.dumps({'message': f'Joined room {room_name}'}))
        else:
            await self.send(text_data=json.dumps({'error': 'Room does not exist'}))

    @database_sync_to_async
    def get_room_by_name(self, name):
        try:
            return Room.objects.get(name=name)
        except Room.DoesNotExist:
            return None

    async def list_rooms(self):
            rooms = await self.get_rooms()
            await self.send(text_data=json.dumps({
                'action': 'list_rooms',
                'rooms': [{'name': room.name} for room in rooms]
            }))

    @database_sync_to_async
    def get_rooms(self):
        return list(Room.objects.all())