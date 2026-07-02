from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import base64
import threading

from core.models import BabyProfile, ActivityLog
from .engine import detection_service
from .models import DetectionEvent
from notifications_app.push import notify_cry, notify_motion


def _send_push_async(func, *args):
    """Send push notification in background thread so it doesn't block the API response."""
    thread = threading.Thread(target=func, args=args, daemon=True)
    thread.start()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def detect_from_frame(request, baby_id):
    try:
        baby = BabyProfile.objects.get(id=baby_id, user=request.user)
    except BabyProfile.DoesNotExist:
        return Response({'error': 'Baby not found'}, status=404)

    frame_b64 = request.data.get('frame')
    if frame_b64:
        try:
            result = detection_service.process_frame(base64.b64decode(frame_b64))
        except Exception:
            result = detection_service.simulate_full()
    else:
        result = detection_service.simulate_full()

    _persist_and_notify(baby, result, request.user)
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def simulate_detection(request, baby_id):
    try:
        baby = BabyProfile.objects.get(id=baby_id, user=request.user)
    except BabyProfile.DoesNotExist:
        return Response({'error': 'Baby not found'}, status=404)

    result = detection_service.simulate_full()
    _persist_and_notify(baby, result, request.user)
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_events(request, baby_id):
    try:
        baby = BabyProfile.objects.get(id=baby_id, user=request.user)
    except BabyProfile.DoesNotExist:
        return Response({'error': 'Baby not found'}, status=404)

    events = DetectionEvent.objects.filter(baby=baby)[:20]
    return Response([{
        'id': e.id,
        'event_type': e.event_type,
        'confidence': e.confidence,
        'audio_level': e.audio_level,
        'motion_level': e.motion_level,
        'timestamp': e.timestamp.isoformat(),
    } for e in events])


# ── Throttle push notifications (don't spam every 2 seconds) ─────────────────
_last_cry_notif    = {}
_last_motion_notif = {}
NOTIF_COOLDOWN_SECONDS = 30  # only send one push per 30s per baby


def _persist_and_notify(baby, result, user):
    """Save events to DB and send push notifications with cooldown."""
    from django.utils import timezone
    import time

    motion = result.get('motion', {})
    cry    = result.get('cry', {})
    now    = time.time()

    if motion.get('detected'):
        DetectionEvent.objects.create(
            baby=baby, event_type='motion',
            confidence=motion.get('confidence', 0),
            motion_level=motion.get('motion_level', 0),
        )
        ActivityLog.objects.create(
            baby=baby, activity_type='motion',
            description=f"Motion detected (level: {motion.get('motion_level', 0):.1f}%)",
            severity='low',
            metadata={'motion_level': motion.get('motion_level', 0)},
        )
        # Push with cooldown
        last = _last_motion_notif.get(baby.id, 0)
        if now - last > NOTIF_COOLDOWN_SECONDS:
            _last_motion_notif[baby.id] = now
            _send_push_async(notify_motion, baby, user, motion.get('motion_level', 0))

    if cry.get('crying'):
        DetectionEvent.objects.create(
            baby=baby, event_type='cry',
            confidence=cry.get('confidence', 0),
            audio_level=cry.get('amplitude_db', 0),
        )
        ActivityLog.objects.create(
            baby=baby, activity_type='cry',
            description=f"Crying detected (amplitude: {cry.get('amplitude_db', 0):.1f} dBFS)",
            severity='medium',
            metadata={'amplitude_db': cry.get('amplitude_db', 0)},
        )
        # Push with cooldown
        last = _last_cry_notif.get(baby.id, 0)
        if now - last > NOTIF_COOLDOWN_SECONDS:
            _last_cry_notif[baby.id] = now
            _send_push_async(notify_cry, baby, user)