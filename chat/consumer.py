import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Conversation


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user = self.scope["user"]

        print("🔌 WebSocket connection attempt:", self.user)

        # ❌ Reject anonymous users
        if not self.user or self.user.is_anonymous:
            print("❌ Unauthorized WebSocket connection")
            await self.close(code=4001)
            return

        # Get conversation ID from URL
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group_name = f"chat_{self.conversation_id}"

        # ✅ Verify user is participant
        if not await self.verify_participant():
            print("❌ User not participant in this conversation")
            await self.close(code=4003)
            return

        # Join group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        print(f"✅ Connected to group: {self.room_group_name}")

        # Send confirmation
        await self.send(text_data=json.dumps({
            "type": "connection_established",
            "conversation_id": str(self.conversation_id)
        }))

    async def disconnect(self, close_code):
        print("🔌 WebSocket disconnected:", close_code)

        # Leave group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """
        Handles messages coming FROM frontend WebSocket
        Example: typing indicator
        """
        try:
            data = json.loads(text_data)
            msg_type = data.get("type")

            # ✅ Typing indicator event
            if msg_type == "typing":
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "typing_indicator",
                        "user_id": str(self.user.id),
                        "is_typing": data.get("is_typing", False)
                    }
                )

        except Exception as e:
            print("❌ Error in receive():", e)

    # ======================================================
    # ✅ GROUP EVENTS (Must match "type" in group_send)
    # ======================================================

    async def chat_message(self, event):
        """
        Receives message broadcast from backend view.py
        """
        await self.send(text_data=json.dumps({
            "type": "message",
            "message": event["message"]
        }))

    async def typing_indicator(self, event):
        """
        Receives typing event from group_send
        """

        # ❌ Don't send typing back to sender
        if str(self.user.id) == event["user_id"]:
            return

        await self.send(text_data=json.dumps({
            "type": "typing",
            "user_id": event["user_id"],
            "is_typing": event["is_typing"]
        }))

    # ======================================================
    # ✅ DATABASE HELPERS
    # ======================================================

    @database_sync_to_async
    def verify_participant(self):
        """
        Ensure user belongs to this conversation
        """
        try:
            convo = Conversation.objects.get(
                id=self.conversation_id,
                tenant=self.user.tenant
            )

            return self.user in [convo.participant_1, convo.participant_2]

        except Conversation.DoesNotExist:
            return False
