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

        # Instead of filtering by both players (which assumes a setting exists for that pair),
        # directly create or update the settings since this action seems to always intend to save or update current settings.
        # This avoids the issue with unique constraints when a new player is involved.
        
        # Assuming there's only one setting to update or the latest one should be updated:
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
