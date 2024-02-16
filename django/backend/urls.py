from django.urls import path
from . import views

urlpatterns = [
    path('api/settings', views.save_settings, name='save_settings'),
]
