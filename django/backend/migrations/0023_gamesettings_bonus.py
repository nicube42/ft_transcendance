# Generated by Django 3.2.25 on 2024-04-23 20:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0022_customuser_is_in_tournament'),
    ]

    operations = [
        migrations.AddField(
            model_name='gamesettings',
            name='bonus',
            field=models.BooleanField(default=True),
        ),
    ]
