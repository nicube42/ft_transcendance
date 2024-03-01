from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class CustomUser(AbstractUser):
    # Add additional fields here
    bio = models.TextField(null=True, blank=True)
    fullname = models.CharField(max_length=255, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)


class MyModel(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    class Meta:
        app_label = 'backend'

class Player(models.Model):
    name = models.CharField(max_length=100)

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