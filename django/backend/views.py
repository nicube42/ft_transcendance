from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import GameSettings, Player
import json

@csrf_exempt
def save_settings(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)
        
        player1_name = data.get('player1')
        player2_name = data.get('player2')
        ball_speed = int(data.get('ballSpeed', 5))
        paddle_speed = int(data.get('paddleSpeed', 5))
        winning_score = int(data.get('winningScore', 5))

        # Validate the input
        if not player1_name or not player2_name:
            return JsonResponse({'error': 'Missing player names'}, status=400)

        # Get or create players
        player1, created1 = Player.objects.get_or_create(name=player1_name)
        player2, created2 = Player.objects.get_or_create(name=player2_name)

        if GameSettings.objects.exists():
            # Update the latest settings
            settings = GameSettings.objects.latest('id')
            settings.player1 = player1
            settings.player2 = player2
            settings.ball_speed = ball_speed
            settings.paddle_speed = paddle_speed
            settings.winning_score = winning_score
        else:
            # Create new settings if none exist
            settings = GameSettings(
                player1=player1,
                player2=player2,
                ball_speed=ball_speed,
                paddle_speed=paddle_speed,
                winning_score=winning_score
            )
        settings.save()

        return JsonResponse({'message': 'Settings updated successfully'}, status=200)
    
    elif request.method == 'GET':
        try:
            settings = GameSettings.objects.latest('id')
            response_data = {
                'player1': settings.player1.name,
                'player2': settings.player2.name,
                'ballSpeed': settings.ball_speed,
                'paddleSpeed': settings.paddle_speed,
                'winningScore': settings.winning_score,
            }
            return JsonResponse(response_data)
        except GameSettings.DoesNotExist:
            return JsonResponse({'error': 'No settings found'}, status=404)

    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

from django.http import JsonResponse
import json
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from .models import CustomUser

def register(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            fullname = data.get('fullname')
            date_of_birth = data.get('date_of_birth')
            bio = data.get('bio')

            
            # Check if the user already exists
            if CustomUser.objects.filter(username=username).exists():
                return JsonResponse({'error': 'Username already exists'}, status=400)
            
            # Create a new user
            user = CustomUser.objects.create(
                username=username,
                password=make_password(password),
                fullname=fullname,
                date_of_birth=date_of_birth,
                bio=bio
            )
            
            user.full_clean()  # Validate the model instance
            user.save()
            
            return JsonResponse({'message': 'User created successfully'}, status=201)
        except ValidationError as e:
            return JsonResponse({'error': e.message_dict}, status=400)  # Return validation errors
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


from django.contrib.auth import authenticate, login
from django.http import JsonResponse
import json

import logging

logger = logging.getLogger(__name__)

@csrf_exempt
def api_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            username = data.get('username')
            password = data.get('password')
            if username is None or password is None:
                return JsonResponse({'error': 'Username or password is missing'}, status=400)
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return JsonResponse({'message': 'Login successful'})
            else:
                return JsonResponse({'error': 'Invalid credentials'}, status=400)
        except json.JSONDecodeError:
            logger.exception('Error decoding JSON in api_login')
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)
        except Exception as e:
            logger.exception('Error in api_login: {}'.format(e))
            return JsonResponse({'error': 'Internal Server Error'}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

from django.http import JsonResponse
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
def user_info(request):
    try:
        if request.user.is_authenticated:
            user_data = {
                'username': request.user.username,
                'fullname': request.user.fullname,
                'date_of_birth': request.user.date_of_birth,
                'bio': request.user.bio,
            }
            return JsonResponse(user_data)
        else:
            return JsonResponse({'error': 'User not authenticated'}, status=401)
    except Exception as e:
        logger.exception("Unexpected error in user_info: %s", e)
        return JsonResponse({'error': 'Internal Server Error'}, status=500)


from django.contrib.auth import logout
from django.http import JsonResponse

def api_logout(request):
    logout(request)
    return JsonResponse({'message': 'Logout successful'})