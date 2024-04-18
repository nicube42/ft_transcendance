# Generated by Django 3.2.25 on 2024-04-17 14:56

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0017_player_user'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='game',
            name='player1_id',
        ),
        migrations.AlterField(
            model_name='game',
            name='player1',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='games', to=settings.AUTH_USER_MODEL),
        ),
    ]