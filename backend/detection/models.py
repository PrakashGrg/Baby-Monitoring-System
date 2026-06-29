from django.db import models
from core.models import BabyProfile


class DetectionEvent(models.Model):
    EVENT_TYPES = [
        ('sleep', 'Sleep Detected'),
        ('awake', 'Awake Detected'),
        ('motion', 'Motion Detected'),
        ('cry', 'Cry Detected'),
        ('no_cry', 'No Cry'),
    ]

    baby = models.ForeignKey(BabyProfile, on_delete=models.CASCADE, related_name='detection_events')
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    confidence = models.FloatField(default=0.0)
    audio_level = models.FloatField(null=True, blank=True)
    motion_level = models.FloatField(null=True, blank=True)
    frame_data = models.TextField(blank=True)  # base64 snapshot
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.baby.name} - {self.event_type} ({self.confidence:.0%})"