from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import GameSettings, Player
import json
from django.views.decorators.http import require_POST

@csrf_exempt
def save_settings(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if request.user.is_authenticated is False:
        return JsonResponse({'error': 'User not authenticated'}, status=401)
    try:
        print('\n\nSAVE_SETTINGS\n\n')
        data = json.loads(request.body)
        player1_name = data.get('player1')
        player2_name = data.get('player2')
        ball_speed = int(data.get('ballSpeed', 5))
        paddle_speed = int(data.get('paddleSpeed', 5))
        winning_score = int(data.get('winningScore', 5))
        bonus = data.get('bonus')
        print(f"\n\n\game bonus: {bonus}n\n")

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
                'bonus': bonus,
            }
        )

        return JsonResponse({'message': 'Settings updated successfully'}, status=200)
    except Exception as e:
        return JsonResponse({'error': 'Error processing your request', 'details': str(e)}, status=500)



from django.http import JsonResponse
from .models import GameSettings

@csrf_exempt
def retrieve_settings(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if request.user.is_authenticated is False:
        return JsonResponse({'error': 'User not authenticated'}, status=401)

    defaults = {
        'player1': 'One',
        'player2': 'Two',
        'ballSpeed': 5,
        'paddleSpeed': 5,
        'winningScore': 5,
        'bonus': True,
    }

    try:
        settings = GameSettings.objects.get(user=request.user)
        response_data = {
            'player1': settings.player1.name,
            'player2': settings.player2.name,
            'ballSpeed': settings.ball_speed,
            'paddleSpeed': settings.paddle_speed,
            'winningScore': settings.winning_score,
            'bonus': settings.bonus,
        }
    except GameSettings.DoesNotExist:
        response_data = defaults

    return JsonResponse(response_data)


import unicodedata
from django.utils.text import get_valid_filename
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.http import JsonResponse
from django.contrib.auth.hashers import make_password
from django.conf import settings
from .forms import CustomUserForm
from django.views.decorators.csrf import csrf_protect

def strip_accents(s):
    """Remove accentuated characters from a string and return a clean string."""
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

@csrf_protect
def register(request):
    if request.method == 'POST':
        form = CustomUserForm(request.POST, request.FILES)
        if CustomUser.objects.filter(username=request.POST.get('username')).exists():
            return JsonResponse({'error': 'Username already exists'}, status=400)
        username = request.POST.get('username')
        password = request.POST.get('password')
        fullname = request.POST.get('fullname')
        profile_pic = request.FILES.get('profile_pic')
        if username is None:
            return JsonResponse({'error': 'Username is missing'}, status=400)
        if password is None:
            return JsonResponse({'error': 'Password is missing'}, status=400)
        if fullname is None:
            return JsonResponse({'error': 'Fullname is missing'}, status=400)
        if len(username) < 4 or len(username) > 20:
            return JsonResponse({'error': 'Username must be between 4 and 20 characters'}, status=400)
        if len(password) < 4 or len(password) > 20:
            return JsonResponse({'error': 'Password must be between 4 and 20 characters'}, status=400)
        if len(fullname) < 4 or len(fullname) > 20:
            return JsonResponse({'error': 'Fullname must be between 4 and 20 characters'}, status=400)

        #check profile picture size and format
        if profile_pic:
            if profile_pic.size > 1024 * 1024:
                return JsonResponse({'error': 'Profile picture size is too large'}, status=400)
            if not profile_pic.content_type.startswith('image'):
                return JsonResponse({'error': 'Profile picture must be an image'}, status=400)
        if form.is_valid():
            user = form.save(commit=False)
            user.password = make_password(form.cleaned_data['password'])

            # Check if a profile picture was uploaded
            if 'profile_pic' in request.FILES:
                file = request.FILES['profile_pic']
                normalized_filename = strip_accents(file.name)
                safe_filename = get_valid_filename(normalized_filename)
                file_name = default_storage.save(safe_filename, ContentFile(file.read()))
                user.profile_pic_url = request.build_absolute_uri("https://localhost:4242/media/pictures/" + file_name)

            user.save()  # Save the user and the file path
            return JsonResponse({'message': 'User created successfully'}, status=201)
        else:
            return JsonResponse({'error': form.errors.as_json(escape_html=True)}, status=400)
    return JsonResponse({"error": "Only POST method is allowed"}, status=405)




# from django.http import JsonResponse
# import json
# from django.contrib.auth.hashers import make_password
# from django.core.exceptions import ValidationError
# from .models import CustomUser

# @csrf_exempt
# def register(request):
#     if request.method == 'POST':
#         try:
#             data = {
#                 "username": request.POST.get('username'),
#                 "password": request.POST.get('password'),
#                 "fullname": request.POST.get('fullname'),
#             }
#             username = data.get('username')
#             print(username)
#             password = data.get('password')
#             print(password)
#             fullname = data.get('fullname')
#             picture = request.FILES.get('picture')

#             if not username or not password or not fullname:
#                 return JsonResponse({"error": "signup information not provided"}, status=400)
#             print("LOL4")

#             if CustomUser.objects.filter(username=username).exists():
#                 return JsonResponse({'error': 'Username already exists'}, status=400)

#             print("LOL5")
#             user = CustomUser.objects.create(
#                 username=username,
#                 password=make_password(password),
#                 fullname=fullname,
#             )
#             print("LOL6")

#             if picture:
#                 print("picture exists")
#                 print(picture)
#                 user.profile_pic = picture

#             print("LOL8")
#             # user.full_clean()
#             #print(user.picture)
#             print("LOL9")
#             user.save()

#             print("LOL10")
#             # print(user.picture)
#             print("LOL11")
#             user_again = CustomUser.objects.get(username=username)
#             print("LOL12")
#             print(user_again.username)
#             print("LOL13")
#             print(user_again.fullname)
#             print("LOL14")
#             print(user_again.password)
#             print("LOL15")
#             print(user_again)
#             print("LOL16")
#           #  print(user_again.picture)
#             print("LOL17")

#             print("LOL_final")
#             return JsonResponse({'message': 'User created successfully'}, status=201)
#         except ValidationError as e:
#             return JsonResponse({'error': e.message_dict}, status=400)
#         except Exception as e:
#             return JsonResponse({'error': str(e)}, status=500)


import os
from django.http import HttpResponseRedirect

@csrf_exempt
def intraAuthorize(request):
    if request.method == 'GET':
        print("intraAuthorize")
        client_id = os.getenv('AUTH_CLIENT_ID')
        redirect_uri = os.getenv('REDIRECT_AUTH_URL')
        response_type = 'code'
        authorization_url = f"https://api.intra.42.fr/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type={response_type}"

        return HttpResponseRedirect(authorization_url)


import requests
import json

@csrf_exempt
def intraCallback(request):
    if request.method == 'GET':
        code = request.GET.get('code')
        if not code:
            return JsonResponse({"error": "Authorization code not provided"}, status=400)

        # Get token from intra
        data_code = {
            'grant_type': 'authorization_code',
            'client_id': os.getenv('AUTH_CLIENT_ID'),
            'client_secret': os.getenv('AUTH_CLIENT_SECRET'),
            'code': code,
            'redirect_uri': os.getenv('REDIRECT_AUTH_URL')
        }
        response = requests.post('https://api.intra.42.fr/oauth/token', data=data_code)
        print("RESPONSE oauth/token")
        print(response.status_code)
        print(response.json())
        try:
            auth_token = response.json()['access_token']
        except KeyError:
            print("Error: intra 42 'access_token' not found in the response.")
            auth_token = None
        # End of getting token from intra

        if not auth_token:
            return JsonResponse({"error": "Could not get token from intra"}, status=400)

        # Get user data from intra
        headers = {
            'Authorization': f'Bearer {auth_token}'
        }
        response = requests.get('https://api.intra.42.fr/v2/me', headers=headers)
        user_data = response.json()
        # End user data from intra

        try:
            print("MDR2")
            print(user_data)
            username = user_data.get('login')
            fullname = user_data.get('usual_full_name')
            print(user_data)
            profile_pic = user_data.get('image')
            print (profile_pic)
            ppUrl = profile_pic['link']
            print("MDR3")
            print(f"profile_pic: {ppUrl}\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n")

            user, is_created = CustomUser.objects.get_or_create(
                username=username,
                fullname=fullname,
                profile_pic_url=ppUrl,
            )

            # Login the created user
            print("MDR3")
            login(request, user)
            print("MDR4")
            csrf_token = get_token(request)
            print("MDR5")

            response = JsonResponse({'message': 'Login successful'})
            response.set_cookie('csrftoken', csrf_token, httponly=False)
            print("end login 42")
            print("MDR6")
            return response
        except ValidationError as e:
            return JsonResponse({'error': e.message_dict}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


from django.contrib.auth import authenticate, login
from django.http import JsonResponse
import json

import logging

logger = logging.getLogger(__name__)

from django.middleware.csrf import get_token
# from django.shortcuts import render
# from django.core.context_processors import csrf
from django.views.decorators.csrf import ensure_csrf_cookie

@csrf_exempt
def api_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            username = data.get('username')
            password = data.get('password')
            if username is None:
                return JsonResponse({'error': 'Username is missing'}, status=400)
            if password is None:
                return JsonResponse({'error': 'Password is missing'}, status=400)
            if len(username) < 4 or len(username) > 20:
                return JsonResponse({'error': 'Username must be between 4 and 20 characters'}, status=400)
            if len(password) < 4 or len(password) > 20:
                return JsonResponse({'error': 'Password must be between 4 and 20 characters'}, status=400)

            user = authenticate(request, username=username, password=password)
            if user is None:
                return JsonResponse({'error': 'Incorrect username or password. Please try again.'}, status=400)

            login(request, user)
            csrf_token = get_token(request)
            response = JsonResponse({'message': 'Login successful'}, status=200)
            response.set_cookie('csrftoken', csrf_token, httponly=False)
            return response
        except json.JSONDecodeError:
            logger.exception('Error decoding JSON')
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)
        except Exception as e:
            logger.exception(f'Error in api_login: {e}')
            return JsonResponse({'error': 'Internal Server Error'}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
import logging

@csrf_exempt
def user_info(request):
    try:
        if request.user.is_authenticated:
            user_data = {
                'id': request.user.id,
                'username': request.user.username,
                'fullname': request.user.fullname,
                'profile_pic': request.user.profile_pic.url if request.user.profile_pic else None,
                'profile_pic_url': request.user.profile_pic_url,
            }
            return JsonResponse(user_data)
        else:
            return JsonResponse({'error': 'User not authenticated'}, status=401)
    except Exception as e:
        logging.exception("Unexpected error in user_info: %s", e)
        return JsonResponse({'error': 'Internal Server Error'}, status=500)


from django.contrib.auth import logout
from django.http import JsonResponse


def api_logout(request):
    try:
        if request.user.is_authenticated:
            logout(request)
            return JsonResponse({'message': 'Logout successful'}, status=200)
        else:
            return JsonResponse({'error': 'User is already logged out '}, status=400)
    except Exception as e:
        return JsonResponse({'error': 'Error during logout', 'details': str(e)}, status=500)


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


@require_POST
def profile_pic_update(request):
    if request.method == 'POST':
        if request.user.is_authenticated is False:
            return JsonResponse({'error': 'User not authenticated'}, status=401)
        form = ProfilePicUpdateForm(request.POST, request.FILES, instance=request.user)
        username = request.POST.get('username')
        if username is None:
            return JsonResponse({'error': 'Username is missing'}, status=400)
        if len(username) < 4 or len(username) > 20:
            return JsonResponse({'error': 'Username must be between 4 and 20 characters'}, status=400)
        picture = request.FILES.get('profile_pic')
        if picture:
            if picture.size > 1024 * 1024:
                return JsonResponse({'error': 'Profile picture size is too large'}, status=400)
            if not picture.content_type.startswith('image'):
                return JsonResponse({'error': 'Profile picture must be an image'}, status=400)
        if form.is_valid():
            form.save()
            return redirect('profile')
    else:
        form = ProfilePicUpdateForm(instance=request.user)
    return render(request, 'app/profile_update.html', {'form': form})


from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from .models import Game
from dateutil import parser


@csrf_exempt
def game_record(request):
    if request.method == 'POST':
        try:
            if request.user.is_authenticated is False:
                return JsonResponse({'error': 'User not authenticated'}, status=401)
            data = json.loads(request.body)
            player1_username = data.get('player1')
            player2_name = data.get('player2')
            start_time = parser.parse(data['start_time'])
            end_time = parser.parse(data['end_time'])

            user = get_user_model().objects.get(username=player1_username)

            Game.objects.create(
                player1=user,
                player2=player2_name,
                player1_score=data['player1_score'],
                player2_score=data['player2_score'],
                start_time=start_time,
                end_time=end_time,
            )
            return JsonResponse({'status': 'success'}, status=201)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


from django.http import JsonResponse
import logging
from .models import Game
from django.db.models import Q, Sum, F


def player_stats(request):
    try:
        user = request.user
        if not user.is_authenticated:
            return JsonResponse({'error': 'User not authenticated'}, status=401)
        games_won = Game.objects.filter(player1=user, player1_score__gt=F('player2_score')).count()
        games_lost = Game.objects.filter(player1=user, player1_score__lt=F('player2_score')).count()

        total_games = games_won + games_lost
        total_score = Game.objects.filter(player1=user).aggregate(total=Sum('player1_score'))['total'] or 0

        data = {
            'gamesPlayed': total_games,
            'totalWins': games_won,
            'totalLosses': games_lost,
            'totalScore': total_score
        }
        print(f"Stats for {user.username}: {data}")
        return JsonResponse(data)
    except Exception as e:
        logging.exception("Error fetching player stats")
        return JsonResponse({'error': 'Server error', 'details': str(e)}, status=500)


from django.http import JsonResponse

from .models import Game


def recent_games(request):
    try:
        current_user = request.user
        if not current_user.is_authenticated:
            return JsonResponse({'error': 'User not authenticated'}, status=401)
        games = Game.objects.filter(Q(player1=current_user) | Q(player2=current_user.username)).order_by('-start_time')[:5]
        games_data = [{
            'player1': game.player1.username,
            'player2': game.player2,
            'player1_score': game.player1_score,
            'player2_score': game.player2_score,
            'duration': game.duration,
            'start_time': game.start_time.strftime('%Y-%m-%d %H:%M:%S'),
            'end_time': game.end_time.strftime('%Y-%m-%d %H:%M:%S'),
            'created_at': game.created_at.strftime('%Y-%m-%d %H:%M:%S')
        } for game in games]

        return JsonResponse(games_data, safe=False)

    except Exception as e:
        logging.exception("Error fetching recent games")
        return JsonResponse({'error': 'Server error', 'details': str(e)}, status=500)


from django.db.models import Count, Q, F
from django.http import JsonResponse

from .models import Game
from django.db.models.functions import TruncMonth


def win_rate_over_time(request):
    current_user = request.user
    if not current_user.is_authenticated:
        return JsonResponse({'error': 'User not authenticated'}, status=401)
    try:
        games_by_month = Game.objects.filter(
            Q(player1=current_user) | Q(player2=current_user.username)
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            total_games=Count('id'),
            wins=Count('id', filter=Q(player1=current_user, player1_score__gt=F('player2_score')) | Q(
                player2=current_user.username, player2_score__gt=F('player1_score')))
        ).order_by('month')

        data = {
            'dates': [game['month'].strftime('%Y-%m') for game in games_by_month if game['month']],
            'winRates': [(game['wins'] / game['total_games'] * 100) if game['total_games'] > 0 else 0 for game in
                         games_by_month]
        }
        return JsonResponse(data)
    except Exception as e:
        logging.exception("Error fetching win rate over time")
        return JsonResponse({'error': 'Server error', 'details': str(e)}, status=500)



from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt


@require_POST
def check_user(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'User not authenticated'}, status=401)
    data = json.loads(request.body)
    username = data.get('username')
    if not username:
        return JsonResponse({'error': 'Username is required'}, status=400)
    if len(username) < 4 or len(username) > 20:
        return JsonResponse({'error': 'Username must be between 4 and 20 characters'}, status=400)
    exists = get_user_model().objects.filter(username=username).exists()
    return JsonResponse({'exists': exists})



from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
import json


@require_POST
def add_friend(request):
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'User not authenticated'}, status=401)
        data = json.loads(request.body)
        friend_username = data.get('friend_username')
        if not friend_username:
            return JsonResponse({'error': 'Friend username is required'}, status=400)

        friend = CustomUser.objects.filter(username=friend_username).first()
        if not friend:
            return JsonResponse({'error': 'User not found'}, status=404)

        request.user.friends.add(friend)
        return JsonResponse({'message': 'Friend added successfully'}, status=200)
    except Exception as e:
        return JsonResponse({'error': 'Error processing your request', 'details': str(e)}, status=500)
    

from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.http import JsonResponse
import json

@login_required
@require_POST
def delete_friend(request):
    try:
        data = json.loads(request.body)
        friend_username = data.get('friend_username')
        if not friend_username:
            return JsonResponse({'error': 'Friend username is required'}, status=400)

        friend = CustomUser.objects.filter(username=friend_username).first()
        if not friend:
            return JsonResponse({'error': 'User not found'}, status=404)

        # Check if the user actually has this friend
        if friend not in request.user.friends.all():
            return JsonResponse({'error': 'This user is not your friend'}, status=400)

        request.user.friends.remove(friend)
        return JsonResponse({'message': 'Friend deleted successfully'}, status=200)
    except Exception as e:
        return JsonResponse({'error': 'Error processing your request', 'details': str(e)}, status=500)



from django.http import JsonResponse


def list_friends(request):
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'User not authenticated'}, status=401)
        friends_list = request.user.friends.all()
        friends_data = [{'username': friend.username, 'fullname': friend.fullname} for friend in friends_list]
        return JsonResponse({'friends': friends_data}, safe=False)
    except Exception as e:
        return JsonResponse({'error': 'Error fetching friends', 'details': str(e)}, status=401)



from django.http import JsonResponse
from .models import CustomUser


def get_user_profile(request, username):
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'User not authenticated'}, status=401)
        user = CustomUser.objects.get(username=username)
        if not user:
            return JsonResponse({'error': 'User not found'}, status=404)
        user_data = {
            'username': user.username,
            'fullname': user.fullname,
            'profile_pic': user.profile_pic.url if user.profile_pic else '/static/default_profile_pic.jpg',
            'profile_pic_url': user.profile_pic_url,
        }
        return JsonResponse(user_data)
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)


def recent_games_all(request, username):
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'User not authenticated'}, status=401)
        user = CustomUser.objects.get(username=username)
        if not user:
            return JsonResponse({'error': 'User not found'}, status=404)
        games = Game.objects.filter(Q(player1=user) | Q(player2=user.username)).order_by('-start_time')[:5]
        games_data = [{
            'player1': game.player1.username,
            'player2': game.player2,
            'player1_score': game.player1_score,
            'player2_score': game.player2_score,
            'duration': game.duration,
            'start_time': game.start_time.strftime('%Y-%m-%d %H:%M:%S'),
            'end_time': game.end_time.strftime('%Y-%m-%d %H:%M:%S'),
            'created_at': game.created_at.strftime('%Y-%m-%d %H:%M:%S')
        } for game in games]

        return JsonResponse(games_data, safe=False)
    except Exception as e:
        return JsonResponse({'error': 'recent games error', 'details': str(e)}, status=500)


def win_rate_over_time_all(request, username):
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'User not authenticated'}, status=401)
        user = CustomUser.objects.get(username=username)
        if not user:
            return JsonResponse({'error': 'User not found'}, status=404)
        games_by_month = Game.objects.filter(
            Q(player1=user) | Q(player2=user.username)
        ).annotate(
            month=TruncMonth('start_time')
        ).values('month').annotate(
            total_games=Count('id'),
            wins=Count('id', filter=Q(player1=user, player1_score__gt=F('player2_score')) | Q(player2=user.username,
                                                                                              player2_score__gt=F(
                                                                                                  'player1_score')))
        ).order_by('month')

        data = {
            'dates': [game['month'].strftime('%Y-%m') for game in games_by_month if game['month']],
            'winRates': [(game['wins'] / game['total_games'] * 100) if game['total_games'] > 0 else 0 for game in
                         games_by_month]
        }

        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': 'Win rate over time error', 'details': str(e)}, status=500)



def player_stats_all(request, username):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'User not authenticated'}, status=401)
    user = CustomUser.objects.get(username=username)
    if not user:
        return JsonResponse({'error': 'User not found'}, status=404)
    try:
        games_won = Game.objects.filter(player1=user, player1_score__gt=F('player2_score')).count()
        games_lost = Game.objects.filter(player1=user, player1_score__lt=F('player2_score')).count()

        total_games = games_won + games_lost
        total_score = Game.objects.filter(player1=user).aggregate(total=Sum('player1_score'))['total'] or 0

        data = {
            'gamesPlayed': total_games,
            'totalWins': games_won,
            'totalLosses': games_lost,
            'totalScore': total_score
        }
        return JsonResponse(data)
    except Exception as e:
        logging.exception("Error fetching player stats for %s", username)
        return JsonResponse({'error': 'Server error', 'details': str(e)}, status=500)


from django.contrib.auth import get_user_model
import json
from django.http import JsonResponse
from django.views.decorators.http import require_POST

from django.views.decorators.csrf import csrf_protect


@require_POST
@csrf_protect
def update_game_status(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'User not authenticated'}, status=401)
    User = get_user_model()
    try:
        data = json.loads(request.body)
        in_game = data.get('is_in_game', 'false').lower() == 'true'
        user = request.user
        if not isinstance(user, User):
            raise ValueError("User instance not of type CustomUser")

        user.is_in_game = in_game
        user.save()
        return JsonResponse({'status': 'updated', 'is_in_game': user.is_in_game})
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


from django.contrib.auth import get_user_model
import json
from django.http import JsonResponse
from django.views.decorators.http import require_POST

from django.views.decorators.csrf import csrf_protect


@require_POST
@csrf_protect
def update_tournament_status(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'User not authenticated'}, status=401)
    User = get_user_model()
    try:
        data = json.loads(request.body)
        in_tournament = data.get('is_in_tournament', 'false').lower() == 'true'
        user = request.user
        if not isinstance(user, User):
            raise ValueError("User instance not of type CustomUser")

        user.is_in_tournament = in_tournament
        user.save()
        return JsonResponse({'status': 'updated', 'is_in_tournament': user.is_in_tournament})
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


from django.http import JsonResponse

from django.views.decorators.http import require_http_methods


@require_http_methods(["GET"])
def check_user_in_tournament(request):
    user = request.user
    if not user.is_authenticated:
        return JsonResponse({'error': 'User not authenticated'}, status=401)
    return JsonResponse({
        'is_in_tournament': user.is_in_tournament
    })

from django.http import JsonResponse
from .models import Room


def check_if_user_in_any_room(request):
    # Ensure the user is authenticated
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'User is not authenticated'}, status=401)

    # Get all rooms the user is part of
    user_rooms = Room.objects.filter(users__id=request.user.id)

    # Check if the user is in any room
    if user_rooms.exists():
        room_names = user_rooms.values_list('name', flat=True)
        return JsonResponse({'status': 'User is in a room', 'rooms': list(room_names)}, status=200)
    else:
        return JsonResponse({'status': 'User is not in any room'}, status=200)  # Changed to 200 OK


def check_number_users_in_room(request, room_name):
    # Ensure the user is authenticated
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'User is not authenticated'}, status=401)

    # Retrieve the room by name
    room = Room.objects.get(name=room_name)
    if not room:
        return JsonResponse({'error': 'Room not found'}, status=404)
    # Count the number of users in the room
    user_count = room.users.count()

    # Return the count of users in the room
    return JsonResponse({'room': room_name, 'user_count': user_count}, status=200)


def renameUser(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'User not authenticated'}, status=401)
        try:
            data = json.loads(request.body)
            new_name = data.get('username')
            if new_name and new_name != request.user.username:
                if CustomUser.objects.filter(username=new_name).exists():
                    return JsonResponse({'error': 'This username is already taken.'}, status=400)

                request.user.username = new_name
                request.user.save()
                return JsonResponse({'message': 'Username updated successfully'}, status=200)
            else:
                return JsonResponse({'error': 'Invalid or unchanged username.'}, status=400)
        except Exception as e:
            return JsonResponse({'error': 'Error updating username', 'details': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)
    
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from .forms import ProfilePicUpdateForm

@login_required
@require_POST
@csrf_exempt
def change_profile_pic(request):
    form = ProfilePicUpdateForm(request.POST, request.FILES, instance=request.user)
    if form.is_valid():
        user = form.save(commit=False)
        if 'profile_pic' in request.FILES:
            file = request.FILES['profile_pic']
            if file.size > 1024 * 1024:
                return JsonResponse({'error': 'Profile picture size is too large'}, status=400)
            if not file.content_type.startswith('image'):
                return JsonResponse({'error': 'Profile picture must be an image'}, status=400)
            normalized_filename = strip_accents(file.name)
            safe_filename = get_valid_filename(normalized_filename)
            file_name = default_storage.save('pictures/' + safe_filename, ContentFile(file.read()))
            user.profile_pic_url = request.build_absolute_uri(settings.MEDIA_URL + file_name)
            print(f"Profile picture URL: {user.profile_pic_url}")
        user.save()
        return JsonResponse({'message': 'Profile picture updated successfully'}, status=200)
    else:
        errors = form.errors.as_data()
        first_error_field = next(iter(errors))
        first_error_message = str(errors[first_error_field][0])
        return JsonResponse({'error': first_error_message}, status=400)