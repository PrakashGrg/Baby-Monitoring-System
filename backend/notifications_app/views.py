from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import PushToken, NotificationLog
from core.models import BabyProfile


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_token(request):
    token = request.data.get('token')
    platform = request.data.get('platform', 'expo')
    if not token:
        return Response({'error': 'Token required'}, status=400)
    obj, created = PushToken.objects.get_or_create(
        token=token,
        defaults={'user': request.user, 'platform': platform}
    )
    if not created:
        obj.user = request.user
        obj.save()
    return Response({'message': 'Token registered', 'created': created})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_notifications(request):
    notifs = NotificationLog.objects.filter(user=request.user)[:50]
    return Response([{
        'id': n.id,
        'type': n.notification_type,
        'title': n.title,
        'body': n.body,
        'read': n.read,
        'baby': n.baby.name if n.baby else None,
        'created_at': n.created_at.isoformat(),
    } for n in notifs])


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_read(request, notif_id):
    try:
        notif = NotificationLog.objects.get(id=notif_id, user=request.user)
        notif.read = True
        notif.save()
        return Response({'message': 'Marked as read'})
    except NotificationLog.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_test_notification(request):
    baby_id = request.data.get('baby_id')
    baby = None
    if baby_id:
        try:
            baby = BabyProfile.objects.get(id=baby_id, user=request.user)
        except BabyProfile.DoesNotExist:
            pass

    notif = NotificationLog.objects.create(
        user=request.user,
        baby=baby,
        notification_type='cry',
        title=f'🍼 {baby.name if baby else "Baby"} needs attention',
        body='Your baby appears to be crying. Check the live feed.',
    )
    return Response({'message': 'Notification created', 'id': notif.id})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    count = NotificationLog.objects.filter(user=request.user, read=False).count()
    return Response({'unread': count})