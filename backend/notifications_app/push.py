"""
Expo Push Notification Service
Sends real push notifications to phones via Expo Push API
"""
import json
import urllib.request
import urllib.error
from typing import List

EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'


def send_push_notification(tokens: List[str], title: str, body: str, data: dict = None, sound: str = 'default'):
    """
    Send push notification to one or more Expo push tokens.
    tokens: list of ExponentPushToken strings
    """
    if not tokens:
        return []

    messages = []
    for token in tokens:
        if not token.startswith('ExponentPushToken'):
            continue
        messages.append({
            'to':    token,
            'title': title,
            'body':  body,
            'sound': sound,
            'data':  data or {},
            'priority': 'high',
            'channelId': 'baby-alerts',
        })

    if not messages:
        return []

    try:
        payload = json.dumps(messages).encode('utf-8')
        req = urllib.request.Request(
            EXPO_PUSH_URL,
            data=payload,
            headers={
                'Content-Type':  'application/json',
                'Accept':        'application/json',
                'Accept-Encoding': 'gzip, deflate',
            },
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            print(f'[PUSH] Sent to {len(messages)} device(s): {result}')
            return result
    except Exception as e:
        print(f'[PUSH] Error sending notification: {e}')
        return []


def notify_cry(baby, user):
    """Send cry alert to all user devices."""
    from notifications_app.models import PushToken, NotificationLog
    tokens = list(PushToken.objects.filter(user=user).values_list('token', flat=True))

    # Log it
    NotificationLog.objects.create(
        user=user,
        baby=baby,
        notification_type='cry',
        title=f'🍼 {baby.name} is crying!',
        body='Your baby needs attention. Tap to open the live feed.',
        sent=bool(tokens),
    )

    return send_push_notification(
        tokens=tokens,
        title=f'🍼 {baby.name} is crying!',
        body='Your baby needs attention. Tap to open the live feed.',
        data={'type': 'cry', 'baby_id': baby.id},
    )


def notify_motion(baby, user, motion_level=0):
    """Send motion alert to all user devices."""
    from notifications_app.models import PushToken, NotificationLog
    tokens = list(PushToken.objects.filter(user=user).values_list('token', flat=True))

    NotificationLog.objects.create(
        user=user,
        baby=baby,
        notification_type='motion',
        title=f'👁️ Motion detected — {baby.name}',
        body=f'Movement detected (level: {motion_level:.1f}%). Check the live feed.',
        sent=bool(tokens),
    )

    return send_push_notification(
        tokens=tokens,
        title=f'👁️ Motion detected — {baby.name}',
        body=f'Movement detected (level: {motion_level:.1f}%). Check the live feed.',
        data={'type': 'motion', 'baby_id': baby.id},
    )


def notify_temperature(baby, user, temperature):
    """Send temperature alert."""
    from notifications_app.models import PushToken, NotificationLog
    tokens = list(PushToken.objects.filter(user=user).values_list('token', flat=True))

    status = 'too cold' if temperature < 18 else 'too hot'
    NotificationLog.objects.create(
        user=user,
        baby=baby,
        notification_type='temperature',
        title=f'🌡️ Temperature alert — {baby.name}',
        body=f"Room is {status} ({temperature}°C). Ideal range is 18–24°C.",
        sent=bool(tokens),
    )

    return send_push_notification(
        tokens=tokens,
        title=f'🌡️ Temperature alert — {baby.name}',
        body=f"Room is {status} ({temperature}°C). Ideal range is 18–24°C.",
        data={'type': 'temperature', 'baby_id': baby.id},
    )