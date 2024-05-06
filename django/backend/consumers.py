from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync
from asgiref.sync import sync_to_async
from .models import Room
from .models import Tournament
from django.contrib.auth import get_user_model
import json
from django.contrib.sessions.models import Session
import logging
from django.db.models import Case, When, Value, BooleanField
from channels.layers import get_channel_layer
import aioredis
import contextlib
import uuid

logger = logging.getLogger(__name__) 

@contextlib.asynccontextmanager
async def get_redis_connection():
    redis = await aioredis.from_url("redis://redis", encoding="utf-8", decode_responses=True)
    try:
        yield redis
    finally:
        await redis.close()

class GameConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user = self.scope.get("user")
        session_key = self.scope["cookies"].get("sessionid")

        if self.user is None or self.user.is_anonymous:
            if session_key:
                self.user = await self.get_user_from_session(session_key)
                if self.user:
                    logger.info(f"Authenticated user from session: {self.user.username}")
                else:
                    logger.info("Failed to authenticate user from session.")
            else:
                logger.info("No session key found or user is anonymous.")

        if self.user and not self.user.is_anonymous:
            await self.track_user_channel(self.user.username, self.channel_name)
            logger.info(f"Tracking user {self.user.username} on channel {self.channel_name}")
            await self.accept()
        else:
            logger.info("User is anonymous or not found, connection rejected.")
            await self.close()

    async def restore_user_state(self):
        user_rooms = await self.get_user_rooms_from_redis(self.user.username)
        for room_name in user_rooms:
            await self.join_room({'room_name': room_name}, reconnect=True)

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
        if self.user and not self.user.is_anonymous:
            await self.update_user_state_in_redis()
            await self.untrack_user_channel(self.scope["user"].username)
            await self.leave_all_rooms()

    async def update_user_state_in_redis(self):
        rooms = await self._get_user_rooms(self.user)
        room_names = [room.name for room in rooms]
        async with get_redis_connection() as redis:
            await redis.set(f"user_state:{self.user.username}", json.dumps({"rooms": room_names}))

    async def get_user_rooms_from_redis(self, username):
        async with get_redis_connection() as redis:
            state_json = await redis.get(f"user_state:{username}")
        if state_json:
            state = json.loads(state_json)
            return state.get("rooms", [])
        return []

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json.get('action')

        if action == 'create_room':
            await self.create_room(text_data_json)
        elif action == 'update_paddle_pos':
            await self.update_paddle_pos(text_data_json)
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
        elif action == 'update_bonus':
            await self.update_bonus(text_data_json)
        elif action == 'delete_room':
            await self.delete_room(text_data_json)
        elif action == 'send_invite':
            await self.send_invite(text_data_json)
        if action == 'create_tournament':
            await self.create_tournament(text_data_json)
        elif action == 'invite_to_tournament':
            await self.invite_to_tournament(text_data_json)
        elif action == 'accept_tournament_invite':
            await self.accept_tournament_invite(text_data_json)
        elif action == 'update_participants':
            tournament_id = text_data_json.get('tournament_id')  # Extract the tournament_id as a string
            if tournament_id:
                await self.update_tournament_participants(tournament_id)  # Pass the extracted ID as a string
            else:
                # Handle the case where tournament_id is not provided or is invalid
                await self.send_message_safe(json.dumps({'error': 'tournament_id is required for updating participants'}))
        elif action == 'send_user_status':
            username = text_data_json.get('username')
            if username:
                await self.send_user_status(username)
            else:
                await self.send_message_safe(json.dumps({'error': 'username is required to send user status'}))
        elif action == 'check_user_in_game':
            username = text_data_json.get('username')
            await self.check_if_user_in_game(username)
        elif action == 'delete_participant_from_tournament':
            await self.delete_participant_from_tournament(text_data_json)
        elif action == 'stop_game':
            await self.stop_game(text_data_json)
        elif action == 'surrender':
            await self.surrendered(text_data_json)
        elif action == 'broadcast_surrender':
            await self.broadcast_surrender(text_data_json)
        elif action == 'retrieve_settings':
            await self.retrieve_settings(text_data_json)
        # elif action == 'start_tournament_matches':
        #     await self.start_tournament_matches(text_data_json)

    async def create_room(self, data):
        room_name = data['room_name']
        user = self.scope['user']
        if user.is_anonymous:
            await self.send_message_safe(json.dumps({'error': 'Authentication required to create room'}))
            return
        room, created = await self.get_or_create_room(name=room_name, user=user)
        if created:
            user_settings = await database_sync_to_async(GameSettings.objects.get)(user=user)
            room_settings = GameSettings.objects.create(
                room=room,
                player1=user_settings.player1,
                player2=user_settings.player2,
                ball_speed=user_settings.ball_speed,
                paddle_speed=user_settings.paddle_speed,
                winning_score=user_settings.winning_score,
                bonus=user_settings.bonus
            )
            room.settings = room_settings
            room.save()
            await self.send_message_safe(json.dumps({'message': f'Room {room_name} created'}))
            await self.broadcast_room_list()
        else:
            await self.send_message_safe(json.dumps({'error': 'Room already exists'}))

    async def join_room(self, data, reconnect=False):
        room_name = data['room_name']
        room = await self.get_room_by_name(room_name)
        if room:
            user_added, user_count = await self.add_or_retrieve_user_in_room(room)
            
            # Determine player position based on the current count of users in the room
            # The first player to join gets "left", the second gets "right"
            logger.info(f"User count in room {room_name}: {user_count}")
            if user_count == 1:
                player_position = "left"  # The first player joining
            elif user_count == 2:
                player_position = "right"  # The second player joining

            if not reconnect:
                await self.channel_layer.group_add(room_name, self.channel_name)
                # await self.send_message_safe(json.dumps({'position': player_position}))
                await self.list_users_in_room(data)
                await self.channel_layer.group_send(room_name, {
                    "type": "player.joined",
                    "position": player_position,
                    "player": self.scope["user"].username,
                    "user_count": user_count,
                })
            
            # Inform the client of their assigned role
            await self.send_message_safe(json.dumps({
                'action': 'assign_role',
                'role': player_position  # Assigns 'left', 'right'
            }))

    async def add_or_retrieve_user_in_room(self, room):
        """
        Add a user to a room if they're not already part of it.
        This function is idempotent; it can be called multiple times without additional effect.
        Returns a tuple of (user_added, user_count), where user_added is a boolean indicating if the user was newly added.
        """
        user = self.scope['user']
        if user.is_anonymous:
            return False, 0
        
        user_already_in_room = await self.is_user_in_room(user, room)
        
        if not user_already_in_room:
            await database_sync_to_async(room.users.add)(user)
            user_added = True
        else:
            user_added = False
        
        user_count = await self.get_user_count(room)
        return user_added, user_count

    @database_sync_to_async
    def is_user_in_room(self, user, room):
        """
        Check if a user is in the given room.
        """
        return room.users.filter(id=user.id).exists()

    async def get_user_count(self, room):
        """
        Asynchronously return the number of users in the given room.
        """
        return await database_sync_to_async(room.users.count)()


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
    
    async def broadcast_room_list(self):
        rooms_data = await self.get_rooms_data(self.scope["user"])
        await self.channel_layer.group_send(
            "lobby",
            {
                "type": "room.list",
                "rooms": rooms_data,
            }
        )

    async def room_list(self, event):
        await self.send(text_data=json.dumps({
            'action': 'list_rooms',
            'rooms': event['rooms'],
        }))

    @database_sync_to_async
    def get_rooms_data(self, user):
        rooms = Room.objects.annotate(is_admin=Case(
            When(admin=user, then=Value(True)),
            default=Value(False),
            output_field=BooleanField()
        )).values('name', 'is_admin')
        return list(rooms)

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
        user = self.scope["user"]
        if user.is_authenticated:
            rooms_data = await self.get_rooms_data(user)
            await self.send_message_safe(json.dumps({
            'action': 'list_rooms',
            'rooms': rooms_data
            }))
        else:
            await self.send(text_data=json.dumps({
                'error': 'User must be logged in to list rooms.'
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
        keyEvent = data['keyEvent']

        await self.channel_layer.group_send(
            room_name,
            {
                'type': 'broadcast_paddle_move',
                'direction': direction,
                'role': role,
                'keyEvent': keyEvent,
                'player': self.scope["user"].username,
                'sender_channel_name': self.channel_name,
            }
        )


    async def broadcast_paddle_move(self, event):
        await self.send_message_safe(json.dumps({
            'action': 'paddle_move',
            'direction': event['direction'],
            'role': event['role'],
            'player': event['player'],
            'keyEvent': event['keyEvent']
        }))

    async def update_bonus(self, data):
        room_name = data['room_name']
        bonusGreen = data['bonusGreen']
        bonusRed = data['bonusRed']

        await self.channel_layer.group_send(
            room_name,
            {
                'action': 'update_bonus',
                'type': 'broadcast_bonus',  # This refers to the function that will actually send updates to clients.
                'bonusGreen': bonusGreen,
                'bonusRed': bonusRed,
                'sender_channel_name': self.channel_name,
            }
        )

    async def broadcast_bonus(self, event):
        await self.send_message_safe(json.dumps({
            'action': 'update_bonus',
            'bonusGreen': event['bonusGreen'],
            'bonusRed': event['bonusRed'],
        }))

    async def retrieve_settings(self, data):
        room_name = data['room_name']
        room = await self.get_room_by_name(room_name)

        if room and room.settings:
            settings_data = {
                'player1': room.settings.player1,
                'player2': room.settings.player2,
                'ball_speed': room.settings.ball_speed,
                'paddle_speed': room.settings.paddle_speed,
                'winning_score': room.settings.winning_score,
                'bonus': room.settings.bonus
            }
            
            await self.channel_layer.group_send(
                room_name,
                {
                    'action': 'retrieve_settings',
                    'type': 'broadcast_settings',  # This will trigger the broadcast_settings method to send updates.
                    'settings': settings_data,
                    'sender_channel_name': self.channel_name,
                }
            )
        elif room is None:
            await self.send_message_safe(json.dumps({'error': 'Room not found'}))
        else:
            await self.send_message_safe(json.dumps({'error': 'No settings found for this room'}))

    async def broadcast_settings(self, event):
        # Broadcast the settings to all clients in the room
        await self.send_message_safe(json.dumps({
            'action': 'retrieve_settings',
            'settings': event['settings'],
        }))

    async def update_paddle_pos(self, data):
        room_name = data['room']

        role = data.get('role')
        leftPaddle = data.get('leftPaddle')
        rightPaddle = data.get('rightPaddle')

        await self.channel_layer.group_send(
            room_name,
            {
                'type': 'broadcast_paddle_pos',
                'role': role,
                'leftPaddle': leftPaddle,
                'rightPaddle': rightPaddle,
            }
        )

    async def broadcast_paddle_pos(self, event):
        await self.send_message_safe(json.dumps({
            'action': 'update_paddle_pos',
            'role': event['role'],
            'leftPaddle': event['leftPaddle'],
            'rightPaddle': event['rightPaddle'],
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

    async def send_invite(self, data):
        invitee_username = data['username']
        room_name = data.get('room_name', 'default_room')
        from_user = self.scope["user"].username

        async with get_redis_connection() as redis:
            invitee_channel_name = await redis.get(f"user_channel:{invitee_username}")

        if invitee_channel_name:
            await self.channel_layer.send(invitee_channel_name, {
                'type': 'receive_invite',
                'from_user': from_user,
                'room_name': room_name,
                'message': f"You have been invited to join the room {room_name} by {from_user}"
            })
            await self.send_message_safe(json.dumps({'message': f'Invitation sent to {invitee_username}'}))
        else:
            await self.send_message_safe(json.dumps({'error': f'User {invitee_username} is not online or does not exist.'}))

    async def receive_invite(self, event):
        await self.send(text_data=json.dumps({
            'action': 'receive_invite',
            'from_user': event['from_user'],
            'room_name': event['room_name'],
            'message': event['message'],
        }))


    async def get_user_channel(self, username):
        redis = aioredis.from_url("redis://redis", encoding="utf-8", decode_responses=True)
        channel_name = await redis.get(f"user_channel:{username}")
        await redis.close()
        return channel_name

    async def track_user_channel(self, username, channel_name):
        async with get_redis_connection() as redis:
            await redis.set(f"user_channel:{username}", channel_name)

    async def untrack_user_channel(self, username):
        async with get_redis_connection() as redis:
            await redis.delete(f"user_channel:{username}")


    async def create_tournament(self, data):
        # Extract necessary data (e.g., tournament name) from the incoming message
        tournament_name = data.get('name', 'Unnamed Tournament')
        user = self.scope['user']
        max_players = data.get('numPlayers', 4)
        
        # Generate a unique tournament ID
        tournament_id = str(uuid.uuid4())
        
        # Create the tournament in the database
        tournament = await self.create_tournament_record(tournament_id, tournament_name, max_players)
        error_message = await self.add_user_to_tournament_participants(user.id, tournament_id)
        await self.channel_layer.group_add(f"tournament_{tournament_id}", self.channel_name)
        # Check if the tournament was successfully created
        if tournament:
            # await self.update_tournament_participants(tournament_id)
            response = {
                'action': 'tournament_created',
                'tournamentId': tournament_id,
                'name': tournament_name,
                'message': 'Tournament created successfully'
            }
        else:
            response = {
                'action': 'tournament_creation_failed',
                'message': 'Failed to create tournament'
            }
        
        # Send the response back to the client
        await self.send(text_data=json.dumps(response))

    @database_sync_to_async
    def create_tournament_record(self, tournament_id, name, max_players):
        # Logic to save the tournament to your database
        # This is a simplified example. Adapt according to your actual Tournament model.
        try:
            tournament = Tournament.objects.create(id=tournament_id, name=name)
            tournament.max_players = max_players
            tournament.save()
            return tournament
        except Exception as e:
            logger.error(f"Failed to create tournament: {e}")
            return None

    async def send_tournament_invite(self, event):
        # Sending the actual invite message to the WebSocket client
        await self.send(text_data=json.dumps({
            'action': 'receive_tournament_invite',
            'from_user': event['from_user'],
            'tournament_id': event['tournament_id'],
            'message': event['message'],
        }))

    async def invite_to_tournament(self, data):
        invitee_username = data['username']
        tournament_id = data['tournamentId']
        from_user = self.scope["user"].username

        # Use Redis to check if the invitee is currently connected by looking up their channel name
        async with get_redis_connection() as redis:
            invitee_channel_name = await redis.get(f"user_channel:{invitee_username}")

        if invitee_channel_name:
            # Prepare the message with the corrected type that points to our handler method
            invite_message = {
                'type': 'send_tournament_invite',  # Corrected to match the handler method in GameConsumer
                'from_user': from_user,
                'tournament_id': tournament_id,
                'message': f"You have been invited to join the tournament {tournament_id} by {from_user}"
            }
            # Send the message to the invitee's channel
            await self.channel_layer.send(invitee_channel_name, invite_message)
            # Optionally, confirm to the inviter that the invite was sent
            await self.send_message_safe(json.dumps({'message': f'Invitation sent to {invitee_username}'}))
        else:
            # Handle the case where the invitee is not online or cannot be found
            await self.send_message_safe(json.dumps({'error': f'User {invitee_username} is not online or does not exist.'}))

    async def update_tournament_participants(self, tournament_id):
        tournament = await self.get_tournament_instance(tournament_id)
        if tournament:
            participant_count = await sync_to_async(tournament.participants.count)()
            max_players = tournament.max_players
            participants = await database_sync_to_async(list)(tournament.participants.all())
            participant_usernames = [p.username for p in participants]
            update_message = {
                'action': 'update_participant_count',
                'participants': participant_usernames,
                'participant_count': participant_count,
                'max_players': max_players,
            }
            await self.send_message_safe(json.dumps(update_message))
        else:
            logger.error(f"Tournament with ID {tournament_id} not found.")

    @database_sync_to_async
    def get_tournament_instance(self, tournament_id):
        try:
            return Tournament.objects.get(id=tournament_id)
        except Tournament.DoesNotExist:
            return None

    async def accept_tournament_invite(self, data):
        user = self.scope['user']
        tournament_id = data['tournamentId']

        # Ensure the user is authenticated before proceeding
        if user.is_anonymous:
            await self.send_message_safe({'error': 'User must be authenticated to accept an invitation.'})
            return

        # Attempt to add the user to the tournament's participants
        added, error_message = await self.add_user_to_tournament_participants(user.id, tournament_id)
        await self.channel_layer.group_add(f"tournament_{tournament_id}", self.channel_name)

        if added:
            # After successfully adding the user, broadcast the updated participant count.
            await self.broadcast_tournament_participant_update(tournament_id)
        else:
            await self.send_message_safe({'error': error_message})

    async def send_json(self, event):
        await self.send(text_data=event['text'])

    async def broadcast_tournament_participant_update(self, tournament_id):
        tournament = await self.get_tournament_instance(tournament_id)
        if tournament:
            participant_count = await sync_to_async(tournament.participants.count)()
            max_players = tournament.max_players
            participants = await database_sync_to_async(list)(tournament.participants.all())
            participant_usernames = [p.username for p in participants]
            update_message = {
                'type': 'send_json',  # Use the built-in handler to send JSON data.
                'text': json.dumps({
                    'action': 'update_participant_count',
                    'participants': participant_usernames,
                    'participant_count': participant_count,
                    'max_players': max_players,
                }),
            }
            await self.channel_layer.group_send(
                f"tournament_{tournament_id}",
                update_message
            )

    @database_sync_to_async
    def add_user_to_tournament_participants(self, user_id, tournament_id):
        try:
            user = get_user_model().objects.get(id=user_id)
            tournament = Tournament.objects.get(id=tournament_id)
            
            # Check if user is already a participant to avoid duplicates
            if tournament.participants.filter(id=user_id).exists():
                return False, 'User is already a participant in this tournament.'

            tournament.participants.add(user)
            tournament.save()
            return True, None  # Successfully added
        except get_user_model().DoesNotExist:
            return False, 'User does not exist.'
        except Tournament.DoesNotExist:
            return False, 'Tournament does not exist.'


    # async def start_tournament_matches(self, data):
    #     # Logic to start tournament matches
    #     # This might involve setting up matches, selecting players, etc.
    #     # Respond to clients with match start information
    #     tournament_id = data['tournamentId']
    #     # Example response
    #     match_info = {'action': 'matches_started', 'matches': 'details_here'}
    #     await self.send(text_data=json.dumps(match_info))

    async def send_user_status(self, username):
        async with get_redis_connection() as redis:
            online_status = await redis.get(f"user_channel:{username}")
            status = 'online' if online_status else 'offline'
            await self.send(text_data=json.dumps({
                'action': 'user_status',
                'username': username,
                'status': status
            }))

    @database_sync_to_async
    def get_user_by_username(self, username):
        try:
            return get_user_model().objects.get(username=username)
        except get_user_model().DoesNotExist:
            return None

    async def check_if_user_in_game(self, username):
        user = await self.get_user_by_username(username)
        if user:
            in_game_status = user.is_in_game
            response = {
                'action': 'user_in_game_status',
                'username': username,
                'in_game': in_game_status
            }
        else:
            response = {
                'action': 'error',
                'message': 'User not found'
            }
        await self.send_message_safe(json.dumps(response))

    async def send_message_safe(self, message):
        if not self.user.is_anonymous:
            await self.send(text_data=message)
        else:
            logger.info("Attempted to send message to anonymous user, action skipped.")

    async def delete_participant_from_tournament(self, data):
        # Extract the tournament ID and the username of the participant to be removed
        tournament_id = data.get('tournament_id')
        username_to_remove = data.get('username')

        if not tournament_id or not username_to_remove:
            await self.send_error_message('Tournament ID and username are required.')
            return

        # Remove the participant from the tournament
        user_removed, message = await self.remove_user_from_tournament(tournament_id, username_to_remove)
        
        if user_removed:
            await self.send_message_safe(json.dumps({
                'message': f'User {username_to_remove} has been removed from the tournament.'
            }))
            # Broadcast the updated tournament state to all connected clients
            await self.broadcast_tournament_participant_update(tournament_id)
        else:
            await self.send_error_message(message)

    @database_sync_to_async
    def remove_user_from_tournament(self, tournament_id, username):
        try:
            tournament = Tournament.objects.get(id=tournament_id)
            user = get_user_model().objects.get(username=username)
            tournament.participants.remove(user)
            tournament.max_players -= 1
            tournament.save()
            return True, f"User {username} removed successfully from the tournament."
        except Tournament.DoesNotExist:
            return False, "Tournament not found."
        except get_user_model().DoesNotExist:
            return False, "User not found."

    async def stop_game(self, data):
        room_name = data['room_name']
        await self.channel_layer.group_send(
            room_name,
            {
                'type': 'game_stop',
                'message': 'stop_game',
            }
        )

    async def game_stop(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'action': message
        }))

    async def surrendered(self, data):
        username = self.scope['user'].username if self.scope['user'].is_authenticated else 'Unknown Player'
        room_name = data['room_name']

        await self.channel_layer.group_send(
            room_name,
            {
                'type': 'broadcast_surrender',
                'message': f'Player has surrendered',
                'player': username
            }
        )

    async def broadcast_surrender(self, event):
        await self.send(text_data=json.dumps({
            'action': 'surrendered',
            'message': event['message'],
            'player': event['player']
        }))