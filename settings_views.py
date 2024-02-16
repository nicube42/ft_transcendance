from django.http import JsonResponse
from .django.backend.models import GameSettings

def get_settings(request):
    if request.method == 'GET':
        # Retrieve the settings
        settings = GameSettings.objects.first()  # Assuming only one set of settings
        if settings:
            return JsonResponse({
                'player1': settings.player1.name,
                'player2': settings.player2.name,
                'ballSpeed': settings.ball_speed,
                'paddleSpeed': settings.paddle_speed,
                'winningScore': settings.winning_score
            })
        else:
            return JsonResponse({'error': 'Settings not found'}, status=404)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)
