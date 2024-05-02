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
    path('api/authorize/',  views.intraAuthorize, name='intra_authorize'),
    path('api/callback/',  views.intraCallback, name='intra_callback'),
    path('api/register/', views.register, name='api-register'),
    path('api/login/', views.api_login, name='api-login'),
    path('api/logout/', views.api_logout, name='logout'),
    path('api/user-info/', views.user_info, name='user_info'),
    path('api/check_auth_status/', views.check_auth_status, name='check_auth_status'),
    path('api/is-user-logged-in/', views.is_user_logged_in, name='is_user_logged_in'),
    path('api/update-profile-pic/', views.profile_pic_update, name='update_profile_pic'),
    path('api/game_record/', game_record, name='game_record'),
    path('api/player/stats/', views.player_stats, name='player_stats'),
    path('api/recent_games/', views.recent_games, name='recent_games'),
    path('api/winrate_over_time/', views.win_rate_over_time, name='winrate_over_time'),
    path('api/check_user/', views.check_user, name='check_user'),
    path('api/add_friend/', views.add_friend, name='add_friend'),
    path('api/list_friends/', views.list_friends, name='list_friends'),
    path('api/get_user_profile/<str:username>/', views.get_user_profile, name='get_user_profile'),
    path('api/player_stats/<str:username>/', views.player_stats_all, name='player_stats_all'),
    path('api/recent_games/<str:username>/', views.recent_games_all, name='recent_games_all'),
    path('api/win_rate_over_time/<str:username>/', views.win_rate_over_time_all, name='win_rate_over_time_all'),
    path('api/update_game_status/', views.update_game_status, name='update_game_status'),
    path('api/update_tournament_status/', views.update_tournament_status, name='update_tournament_status'),
    path('api/check_user_in_tournament/', views.check_user_in_tournament, name='check_user_in_tournament'),
    path('api/check-if-user-in-any-room/', views.check_if_user_in_any_room, name='check-if-user-in-any-room'),
    path('api/room/<str:room_name>/user-count/', views.check_number_users_in_room, name='check_number_users_in_room'),
    path('api/rename-user/', views.renameUser, name='renameUser'),
    path('api/change-profile-pic/', views.change_profile_pic, name='change_proifile_pic'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
