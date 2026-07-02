from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.db.models import Avg
from django.utils import timezone
from datetime import timedelta, date
import random, math, threading

from .models import BabyProfile, ActivityLog, SensorReading
from .serializers import (RegisterSerializer, UserSerializer, BabyProfileSerializer,
                           ActivityLogSerializer, SensorReadingSerializer)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({'message': 'Account created successfully',
                         'user': UserSerializer(user).data}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(UserSerializer(request.user).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


class BabyProfileViewSet(viewsets.ModelViewSet):
    serializer_class = BabyProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BabyProfile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_serializer_context(self):
        return {'request': self.request}


class ActivityLogListView(generics.ListCreateAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        baby_id = self.kwargs.get('baby_id')
        qs = ActivityLog.objects.filter(baby__user=self.request.user)
        if baby_id:
            qs = qs.filter(baby_id=baby_id)
        activity_type = self.request.query_params.get('type')
        if activity_type:
            qs = qs.filter(activity_type=activity_type)
        days = self.request.query_params.get('days', 7)
        since = timezone.now() - timedelta(days=int(days))
        return qs.filter(timestamp__gte=since)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_summary_view(request, baby_id):
    try:
        baby = BabyProfile.objects.get(id=baby_id, user=request.user)
    except BabyProfile.DoesNotExist:
        return Response({'error': 'Baby not found'}, status=404)

    target_date = request.query_params.get('date', date.today().isoformat())
    try:
        target_date = date.fromisoformat(target_date)
    except ValueError:
        target_date = date.today()

    start = timezone.make_aware(timezone.datetime.combine(target_date, timezone.datetime.min.time()))
    end   = timezone.make_aware(timezone.datetime.combine(target_date, timezone.datetime.max.time()))

    activities      = ActivityLog.objects.filter(baby=baby, timestamp__range=(start, end))
    sensor_readings = SensorReading.objects.filter(baby=baby, timestamp__range=(start, end))

    sleep_minutes = sum(a.duration_minutes or 0 for a in activities if a.activity_type == 'sleep')
    awake_minutes = sum(a.duration_minutes or 0 for a in activities if a.activity_type == 'awake')
    avg_temp = sensor_readings.aggregate(avg=Avg('temperature'))['avg'] or 22.0
    avg_hum  = sensor_readings.aggregate(avg=Avg('humidity'))['avg'] or 50.0

    return Response({
        'date': target_date.isoformat(),
        'baby_name': baby.name,
        'total_sleep_minutes': sleep_minutes,
        'total_awake_minutes': awake_minutes,
        'cry_count':    activities.filter(activity_type='cry').count(),
        'motion_count': activities.filter(activity_type='motion').count(),
        'avg_temperature': round(avg_temp, 1),
        'avg_humidity':    round(avg_hum, 1),
        'activity_breakdown': [
            {'type': t, 'count': activities.filter(activity_type=t).count()}
            for t in ['sleep', 'awake', 'cry', 'motion', 'feeding', 'diaper']
        ],
        'activities': ActivityLogSerializer(activities[:20], many=True).data,
    })


# Throttle temperature push — max once per 5 minutes per baby
_last_temp_notif = {}
TEMP_NOTIF_COOLDOWN = 300

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sensor_simulate_view(request, baby_id):
    try:
        baby = BabyProfile.objects.get(id=baby_id, user=request.user)
    except BabyProfile.DoesNotExist:
        return Response({'error': 'Baby not found'}, status=404)

    hour        = timezone.now().hour
    base_temp   = 21.0 + 2 * math.sin((hour - 14) * math.pi / 12)
    temperature = round(base_temp + random.uniform(-0.5, 0.5), 1)
    humidity    = round(50 + random.uniform(-5, 5), 1)

    reading = SensorReading.objects.create(baby=baby, temperature=temperature, humidity=humidity)

    if reading.is_temperature_alert:
        ActivityLog.objects.create(
            baby=baby, activity_type='temperature_alert',
            description=f'Temperature alert: {temperature}°C', severity='high'
        )
        # Push with cooldown
        import time
        now  = time.time()
        last = _last_temp_notif.get(baby.id, 0)
        if now - last > TEMP_NOTIF_COOLDOWN:
            _last_temp_notif[baby.id] = now
            def _push():
                from notifications_app.push import notify_temperature
                notify_temperature(baby, request.user, temperature)
            threading.Thread(target=_push, daemon=True).start()

    return Response(SensorReadingSerializer(reading).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def weekly_chart_view(request, baby_id):
    try:
        baby = BabyProfile.objects.get(id=baby_id, user=request.user)
    except BabyProfile.DoesNotExist:
        return Response({'error': 'Baby not found'}, status=404)

    labels, sleep_data, cry_data, motion_data = [], [], [], []
    today = date.today()

    for i in range(6, -1, -1):
        d     = today - timedelta(days=i)
        labels.append(d.strftime('%a'))
        start = timezone.make_aware(timezone.datetime.combine(d, timezone.datetime.min.time()))
        end   = timezone.make_aware(timezone.datetime.combine(d, timezone.datetime.max.time()))
        acts  = ActivityLog.objects.filter(baby=baby, timestamp__range=(start, end))
        sleep_data.append(sum(a.duration_minutes or 0 for a in acts if a.activity_type == 'sleep'))
        cry_data.append(acts.filter(activity_type='cry').count())
        motion_data.append(acts.filter(activity_type='motion').count())

    return Response({
        'labels':        labels,
        'sleep_minutes': sleep_data,
        'cry_counts':    cry_data,
        'motion_counts': motion_data,
    })