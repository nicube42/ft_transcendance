from django.urls import path, include
from . import views
from django.urls import path, include
from django.contrib.auth.views import LoginView, LogoutView
from .views import register

urlpatterns = [
    path('api/settings', views.save_settings, name='save_settings'),
    path('api/register/', views.register, name='api-register'),
    path('api/login/', views.api_login, name='api-login'),
    path('api/logout/', views.api_logout, name='logout'),
    path('api/user-info/', views.user_info, name='user_info'),
]

# LoginView.as_view()