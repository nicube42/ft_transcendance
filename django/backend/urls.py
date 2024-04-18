from django.urls import path, include
from . import views
from django.urls import path, include
from django.contrib.auth.views import LoginView, LogoutView
from .views import register
from django.conf import settings
from django.conf.urls.static import static
from .views import game_record

urlpatterns = [
    path('api/settings', views.save_settings, name='save_settings'),
    path('api/settings/retrieve', views.retrieve_settings, name='retrieve_settings'),
    path('api/register/', views.register, name='api-register'),
    path('api/login/', views.api_login, name='api-login'),
    path('api/logout/', views.api_logout, name='logout'),
    path('api/user-info/', views.user_info, name='user_info'),
    path('api/check_auth_status/', views.check_auth_status, name='check_auth_status'),
    path('api/is-user-logged-in/', views.is_user_logged_in, name='is_user_logged_in'),
    path('update-profile-pic/', views.profile_pic_update, name='update_profile_pic'),
    path('api/game_record/', game_record, name='game_record'),
    path('api/player/stats/', views.player_stats, name='player_stats'),
    path('api/recent_games/', views.recent_games, name='recent_games'),
    path('api/winrate_over_time/', views.win_rate_over_time, name='winrate_over_time'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
