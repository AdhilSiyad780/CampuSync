import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser


class AnnouncementConsumer(AsyncWebsocketConsumer):

    async def connect(self):

        self.user = self.scope["user"]

        print("🔌 WS CONNECT ATTEMPT:", self.user)

        # Reject anonymous
        if self.user is None or self.user.is_anonymous:
            print("❌ Anonymous user rejected")
            await self.close()
            return

        # Tenant safe check (no DB hit)
        if not self.user.tenant_id:
            print("❌ User has no tenant assigned")
            await self.close()
            return

        # Group name per tenant
        self.group_name = f"announcements_tenant_{self.user.tenant_id}"

        # ✅ JOIN GROUP
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

        print("✅ WebSocket accepted")
        print("✅ Joined group:", self.group_name)

        # Optional welcome message
        await self.send(text_data=json.dumps({
            "type": "connection_established",
            "message": "WebSocket Connected Successfully"
        }))

    async def disconnect(self, close_code):

        # Leave group
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

        print("🔌 WebSocket disconnected", close_code)

    # ✅ THIS METHOD RECEIVES GROUP EVENTS
    async def announcement_message(self, event):

        await self.send(text_data=json.dumps({
            "type": "announcement",
            "action": event["action"],
            "data": event.get("data"),
            "announcement_id": event.get("announcement_id")
        }))
