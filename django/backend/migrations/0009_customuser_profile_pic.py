# Generated by Django 3.2.25 on 2024-04-01 04:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0008_loggedinuser'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='profile_pic',
            field=models.ImageField(default='default.jpg', upload_to='profile_pics/'),
        ),
    ]
