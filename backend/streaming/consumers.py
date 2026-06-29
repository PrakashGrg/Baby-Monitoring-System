import json
import base64
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class StreamConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for live camera streaming."""

    async def connect(self):
        self.baby_id = self.scope['url_route']['kwargs']['baby_id']
        self.room_group_name = f'stream_{self.baby_id}'

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        await self.send(text_data=json.dumps({'type': 'connected', 'baby_id': self.baby_id}))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        if text_data:
            data = json.loads(text_data)
            msg_type = data.get('type')

            if msg_type == 'frame':
                # Broadcast frame to all viewers
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'stream_frame',
                        'frame': data.get('frame'),
                        'timestamp': data.get('timestamp'),
                    }
                )
            elif msg_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))

    async def stream_frame(self, event):
        await self.send(text_data=json.dumps({
            'type': 'frame',
            'frame': event.get('frame'),
            'timestamp': event.get('timestamp'),
        }))

    async def detection_alert(self, event):
        await self.send(text_data=json.dumps({
            'type': 'detection_alert',
            'alert': event.get('alert'),
        }))