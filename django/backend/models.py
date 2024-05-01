from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.contrib.auth import get_user_model

class CustomUser(AbstractUser):
    fullname = models.CharField(max_length=255, null=True, blank=True)
    profile_pic = models.ImageField(null=True, blank=True, upload_to='pictures/', default='pictures/default.jpg')
    friends = models.ManyToManyField('self', related_name='my_friends', blank=True)
    is_in_game = models.BooleanField(default=False)
    is_in_tournament = models.BooleanField(default=False)

class MyModel(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    class Meta:
        app_label = 'backend'

class Player(models.Model):
    user = models.OneToOneField(get_user_model(), on_delete=models.CASCADE, null=True)
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Game(models.Model):
    player1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='games')
    player2 = models.CharField(max_length=100)
    player1_score = models.IntegerField(default=0)
    player2_score = models.IntegerField(default=0)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    @property
    def duration(self):
        return (self.end_time - self.start_time).total_seconds()
    
    @property
    def player1_wins(self):
        return self.player1_score > self.player2_score

class GameSettings(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='game_settings', null=True)
    player1 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='player1_settings')
    player2 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='player2_settings')
    ball_speed = models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(10)])
    paddle_speed = models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(10)])
    winning_score = models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(10)])


class Room(models.Model):
    name = models.CharField(max_length=100, unique=True)
    users = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='rooms', blank=True)
    admin = models.ForeignKey(CustomUser(), on_delete=models.CASCADE, related_name='admin_rooms', null=True)

class LoggedInUser(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)

    def __str__(self):
        return self.user.username
    
class Tournament(models.Model):
    id = models.UUIDField(primary_key=True, default=models.UUIDField, editable=False)
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=[
        ('NOT_STARTED', 'Not Started'),
        ('ONGOING', 'Ongoing'),
        ('COMPLETED', 'Completed')
    ], default='NOT_STARTED')
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='tournaments')
    game_settings = models.ForeignKey(GameSettings, on_delete=models.SET_NULL, null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    max_players = models.PositiveIntegerField(default=4, validators=[MinValueValidator(2)])

    def __str__(self):
        return self.name

    @property
    def current_player_count(self):
        """Dynamically calculate the number of participants."""
        return self.participants.count()

    @property
    def slots_remaining(self):
        """Calculate remaining slots."""
        return max(0, self.max_players - self.current_player_count)

    class Meta:
        app_label = 'backend'
