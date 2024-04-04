from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import GameSettings, Player
import json
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST

@csrf_exempt
@login_required
def save_settings(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        data = json.loads(request.body)
        player1_name = data.get('player1')
        player2_name = data.get('player2')
        ball_speed = int(data.get('ballSpeed', 5))
        paddle_speed = int(data.get('paddleSpeed', 5))
        winning_score = int(data.get('winningScore', 5))

        if not player1_name or not player2_name:
            return JsonResponse({'error': 'Missing player names'}, status=400)
        
        player1, _ = Player.objects.get_or_create(name=player1_name)
        player2, _ = Player.objects.get_or_create(name=player2_name)

        settings, created = GameSettings.objects.update_or_create(
            user=request.user,
            defaults={
                'player1': player1,
                'player2': player2,
                'ball_speed': ball_speed,
                'paddle_speed': paddle_speed,
                'winning_score': winning_score,
            }
        )

        return JsonResponse({'message': 'Settings updated successfully'}, status=200)
    except Exception as e:
        return JsonResponse({'error': 'Error processing your request', 'details': str(e)}, status=500)


from django.http import JsonResponse
from .models import GameSettings
from django.contrib.auth.decorators import login_required

@csrf_exempt
@login_required
def retrieve_settings(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    defaults = {
        'player1': 'One', 
        'player2': 'Two', 
        'ballSpeed': 5,
        'paddleSpeed': 5,
        'winningScore': 5
    }
    
    try:
        settings = GameSettings.objects.get(user=request.user)
        response_data = {
            'player1': settings.player1.name,
            'player2': settings.player2.name,
            'ballSpeed': settings.ball_speed,
            'paddleSpeed': settings.paddle_speed,
            'winningScore': settings.winning_score,
        }
    except GameSettings.DoesNotExist:
        response_data = defaults

    return JsonResponse(response_data)



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

            
            if CustomUser.objects.filter(username=username).exists():
                return JsonResponse({'error': 'Username already exists'}, status=400)
            
            user = CustomUser.objects.create(
                username=username,
                password=make_password(password),
                fullname=fullname,
                date_of_birth=date_of_birth,
                bio=bio
            )
            
            user.full_clean()
            user.save()
            
            return JsonResponse({'message': 'User created successfully'}, status=201)
        except ValidationError as e:
            return JsonResponse({'error': e.message_dict}, status=400)
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
                request.session.save()
                return JsonResponse({'message': 'Login successful'})
            else:
                return JsonResponse({'error': 'Invalid credentials'}, status=400)
        except json.JSONDecodeError:
            logger.exception('Error decoding JSON in api_login')
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)
        except Exception as e:
            logger.exception(f'Error in api_login: {e}')
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


from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from .models import CustomUser

def is_user_logged_in(request):
    username = request.GET.get('username', None)
    if username is None:
        return JsonResponse({'error': 'Username parameter is missing.'}, status=400)
    
    user = CustomUser.objects.filter(username=username).first()
    if user is None:
        return JsonResponse({'error': 'User not found'}, status=404)
    
    is_logged_in = LoggedInUser.objects.filter(user=user).exists()
    return JsonResponse({'is_logged_in': is_logged_in})
    
def check_auth_status(request):
    session_compromised = False

    if request.user.is_authenticated:
        if session_compromised:
            logout(request)
            return JsonResponse({"error": "Session is compromised. Please log in again."}, status=403)
        else:
            return JsonResponse({"is_authenticated": True})
    else:
        return JsonResponse({"is_authenticated": False}, status=401)
    

from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver
from .models import LoggedInUser

@receiver(user_logged_in)
def on_user_login(sender, request, user, **kwargs):
    LoggedInUser.objects.get_or_create(user=user)

@receiver(user_logged_out)
def on_user_logout(sender, request, user, **kwargs):
    LoggedInUser.objects.filter(user=user).delete()

from django.shortcuts import render, redirect
from .forms import ProfilePicUpdateForm
from django.contrib.auth.decorators import login_required

@login_required
@require_POST
def profile_pic_update(request):
    if request.method == 'POST':
        form = ProfilePicUpdateForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            return redirect('profile')
    else:
        form = ProfilePicUpdateForm(instance=request.user)
    return render(request, 'app/profile_update.html', {'form': form})
