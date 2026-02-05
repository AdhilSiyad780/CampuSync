

import re
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token):
    try:
        access = AccessToken(token)
        user_id = access["user_id"]

        # ✅ Load user safely
        return User.objects.get(id=user_id)

    except Exception as e:
        print("JWT ERROR:", e)
        return AnonymousUser()


class CookieJWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):

        headers = dict(scope["headers"])
        token = None

        if b"cookie" in headers:
            raw_cookie = headers[b"cookie"].decode()

            match = re.search(r"access_token=([^;]+)", raw_cookie)

            if match:
                token = match.group(1)
                print("✅ TOKEN FOUND")
            else:
                print("❌ TOKEN NOT FOUND")

        if token:
            scope["user"] = await get_user_from_token(token)
        else:
            scope["user"] = AnonymousUser()

        return await self.app(scope, receive, send)


