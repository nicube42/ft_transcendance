from django.urls import path, include
from . import views
from django.urls import path, include
from django.contrib.auth.views import LoginView, LogoutView
from .views import register

urlpatterns = [
    path('api/settings', views.save_settings, name='save_settings'),
    path('api/register/', views.register, name='api-register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
]

