from django.db import models
from django.contrib.auth.models import User


class BabyProfile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='babies')
    name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')])
    weight = models.FloatField(null=True, blank=True, help_text='Weight in kg')
    height = models.FloatField(null=True, blank=True, help_text='Height in cm')
    photo = models.ImageField(upload_to='baby_photos/', null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.user.username})"

    @property
    def age_in_months(self):
        from datetime import date
        today = date.today()
        return (today.year - self.date_of_birth.year) * 12 + (today.month - self.date_of_birth.month)


class ActivityLog(models.Model):
    ACTIVITY_TYPES = [
        ('sleep', 'Sleep'),
        ('awake', 'Awake'),
        ('cry', 'Crying'),
        ('motion', 'Motion Detected'),
        ('temperature_alert', 'Temperature Alert'),
        ('humidity_alert', 'Humidity Alert'),
        ('feeding', 'Feeding'),
        ('diaper', 'Diaper Change'),
    ]

    baby = models.ForeignKey(BabyProfile, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPES)
    description = models.TextField(blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True)
    severity = models.CharField(
        max_length=10,
        choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')],
        default='low'
    )
    metadata = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.baby.name} - {self.activity_type} at {self.timestamp}"


class SensorReading(models.Model):
    baby = models.ForeignKey(BabyProfile, on_delete=models.CASCADE, related_name='sensor_readings')
    temperature = models.FloatField()  # Celsius
    humidity = models.FloatField()     # Percentage
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.baby.name} - {self.temperature}°C / {self.humidity}% at {self.timestamp}"

    @property
    def is_temperature_alert(self):
        return self.temperature < 16 or self.temperature > 26

    @property
    def is_humidity_alert(self):
        return self.humidity < 40 or self.humidity > 60