# class_announcement_attendence/consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()

class AnnouncementConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print(f"🔌 WebSocket connection attempt")
        
        # Get user from scope
        self.user = self.scope.get('user')
        
        if not self.user or self.user.is_anonymous:
            print(f"❌ Unauthorized WebSocket connection attempt")
            await self.close(code=4001)
            return
        
        print(f"✅ User connected: {self.user.email}")
        
        # Check if user has tenant
        if not hasattr(self.user, 'tenant') or not self.user.tenant:
            print(f"❌ User has no tenant")
            await self.close(code=4002)
            return
        
        # Create a room group name based on tenant
        self.tenant_id = str(self.user.tenant.id)
        self.room_group_name = f'announcements_{self.tenant_id}'
        
        print(f"📡 Joining group: {self.room_group_name}")
        
        # Join tenant announcement group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send connection success message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Connected to announcements for tenant {self.tenant_id}'
        }))
        
        print(f"✅ WebSocket connected successfully")

    async def disconnect(self, close_code):
        print(f"🔌 WebSocket disconnected with code: {close_code}")
        
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        print(f"📨 Received message: {text_data}")
        # Handle any client-side messages if needed
        pass

    async def announcement_created(self, event):
        print(f"📢 Broadcasting announcement_created")
        announcement = event['announcement']
        action = event.get('action', 'created')
        
        # Check if user should see this announcement
        user_type = self.user.user_type
        target_audience = announcement.get('target_audience', 'all')
        
        should_send = (
            target_audience == 'all' or
            target_audience == f'{user_type}s' or
            user_type == 'admin'
        )
        
        if should_send:
            await self.send(text_data=json.dumps({
                'type': 'announcement',
                'action': action,
                'data': announcement
            }))
    
    async def announcement_updated(self, event):
        print(f"📢 Broadcasting announcement_updated")
        announcement = event['announcement']
        
        await self.send(text_data=json.dumps({
            'type': 'announcement',
            'action': 'updated',
            'data': announcement
        }))
    
    async def announcement_deleted(self, event):
        print(f"📢 Broadcasting announcement_deleted")
        announcement_id = event['announcement_id']
        
        await self.send(text_data=json.dumps({
            'type': 'announcement',
            'action': 'deleted',
            'data': {'id': announcement_id}
        }))