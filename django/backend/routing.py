from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from backend.consumers import GameConsumer

websocket_urlpatterns = [
    path('ws/game/', GameConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    'websocket': AuthMiddlewareStack(
        URLRouter([
            path('ws/game/', GameConsumer.as_asgi()),
        ])
    ),
})
