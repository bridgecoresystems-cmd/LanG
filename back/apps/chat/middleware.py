from django.db import close_old_connections
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from django.conf import settings
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None

class JWTAuthMiddleware(BaseMiddleware):
    """
    Middleware для аутентификации WebSocket соединений через JWT токен.
    Токен передается в query params: ws://.../?token=XYZ
    """
    async def __call__(self, scope, receive, send):
        close_old_connections()
        
        # Получаем токен из query string
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]

        if token:
            try:
                # Проверяем токен без обращения к БД
                UntypedToken(token)
                
                # Декодируем токен для получения user_id
                decoded_data = jwt_decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                user_id = decoded_data.get("user_id")
                
                # Получаем пользователя из БД
                scope["user"] = await get_user(user_id)
            except (InvalidToken, TokenError, Exception):
                from django.contrib.auth.models import AnonymousUser
                scope["user"] = AnonymousUser()
        else:
            from django.contrib.auth.models import AnonymousUser
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)

