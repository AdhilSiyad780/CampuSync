# core/middleware.py

import http.cookies
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token):
    try:
        access = AccessToken(token)

        user_id = int(access["user_id"])  # ✅ important

        return User.objects.select_related("tenant").get(id=user_id)

    except Exception as e:
        print("❌ Token auth failed:", e)
        return AnonymousUser()


class CookieJWTAuthMiddleware(BaseMiddleware):
    """
    Proper Channels middleware to authenticate WebSocket users via HttpOnly cookie JWT.
    """

    async def __call__(self, scope, receive, send):

        headers = dict(scope["headers"])
        token = None

        # ✅ Read cookie header
        if b"cookie" in headers:
            cookie = http.cookies.SimpleCookie()
            cookie.load(headers[b"cookie"].decode())

            if "access_token" in cookie:
                token = cookie["access_token"].value
                print("🍪 WS Cookie token found")

        # ✅ Authenticate user
        if token:
            scope["user"] = await get_user_from_token(token)
        else:
            scope["user"] = AnonymousUser()
            print("❌ No access_token cookie in WS request")

        return await super().__call__(scope, receive, send)
