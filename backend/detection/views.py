from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import base64

from core.models import BabyProfile, ActivityLog
from .engine import detection_service
from .models import DetectionEvent


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def detect_from_frame(request, baby_id):
    """Process a base64-encoded JPEG frame and return detection results."""
    try:
        baby = BabyProfile.objects.get(id=baby_id, user=request.user)
    except BabyProfile.DoesNotExist:
        return Response({'error': 'Baby not found'}, status=404)

    frame_b64 = request.data.get('frame')
    if frame_b64:
        try:
            frame_bytes = base64.b64decode(frame_b64)
            result = detection_service.process_frame(frame_bytes)
        except Exception:
            result = detection_service.simulate_full()
    else:
        result = detection_service.simulate_full()

    # Persist significant events
    _persist_events(baby, result)

    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def simulate_detection(request, baby_id):
    """Simulate detection without a real camera frame."""
    try:
        baby = BabyProfile.objects.get(id=baby_id, user=request.user)
    except BabyProfile.DoesNotExist:
        return Response({'error': 'Baby not found'}, status=404)

    result = detection_service.simulate_full()
    _persist_events(baby, result)
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


def _persist_events(baby, result):
    """Save detection results to DB and create activity logs."""
    motion = result.get('motion', {})
    sleep_state = result.get('sleep_state', {})
    cry = result.get('cry', {})

    if motion.get('detected'):
        DetectionEvent.objects.create(
            baby=baby,
            event_type='motion',
            confidence=motion.get('confidence', 0),
            motion_level=motion.get('motion_level', 0),
        )
        ActivityLog.objects.create(
            baby=baby,
            activity_type='motion',
            description=f"Motion detected (level: {motion.get('motion_level', 0):.1f}%)",
            severity='low',
            metadata={'motion_level': motion.get('motion_level', 0)},
        )

    if cry.get('crying'):
        DetectionEvent.objects.create(
            baby=baby,
            event_type='cry',
            confidence=cry.get('confidence', 0),
            audio_level=cry.get('amplitude_db', 0),
        )
        ActivityLog.objects.create(
            baby=baby,
            activity_type='cry',
            description=f"Crying detected (amplitude: {cry.get('amplitude_db', 0):.1f} dBFS)",
            severity='medium',
            metadata={'amplitude_db': cry.get('amplitude_db', 0)},
        )