from django.db import models
from django.contrib.auth.models import User
from core.models import BabyProfile


class PushToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='push_tokens')
    token = models.CharField(max_length=255, unique=True)
    platform = models.CharField(max_length=10, choices=[('ios', 'iOS'), ('android', 'Android'), ('expo', 'Expo')])
    created_at = models.DateTimeField(auto_now_add=True)


class NotificationLog(models.Model):
    NOTIFICATION_TYPES = [
        ('cry', 'Baby Crying'),
        ('motion', 'Motion Detected'),
        ('temperature', 'Temperature Alert'),
        ('humidity', 'Humidity Alert'),
        ('sleep', 'Sleep State Change'),
        ('summary', 'Daily Summary'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    baby = models.ForeignKey(BabyProfile, on_delete=models.CASCADE, null=True)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    body = models.TextField()
    sent = models.BooleanField(default=False)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']