# core/middleware.py

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()

@database_sync_to_async
def get_user(token):
    try:
        access_token = AccessToken(token)
        user_id = access_token['user_id']
        user = User.objects.select_related('tenant').get(id=user_id)
        print(f"✅ User authenticated: {user.email}")
        return user
    except (InvalidToken, TokenError) as e:
        print(f"❌ Token validation failed: {e}")
        return AnonymousUser()
    except User.DoesNotExist:
        print(f"❌ User not found")
        return AnonymousUser()
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return AnonymousUser()

class TokenAuthMiddleware:
    """
    Custom middleware for JWT authentication in WebSockets
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        # Get token from query string
        query_string = scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token = params.get('token', [None])[0]
        
        print(f"🔍 WebSocket connection attempt with token: {token[:20] if token else 'None'}...")
        
        # Authenticate user
        if token:
            scope['user'] = await get_user(token)
        else:
            scope['user'] = AnonymousUser()
            print("❌ No token provided")
        
        return await self.app(scope, receive, send)