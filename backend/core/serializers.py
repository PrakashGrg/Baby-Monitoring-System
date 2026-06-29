from rest_framework import serializers
from django.contrib.auth.models import User
from .models import BabyProfile, ActivityLog, SensorReading


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class BabyProfileSerializer(serializers.ModelSerializer):
    age_in_months = serializers.ReadOnlyField()
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = BabyProfile
        fields = [
            'id', 'name', 'date_of_birth', 'gender', 'weight', 'height',
            'photo', 'photo_url', 'notes', 'age_in_months', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
        return None


class ActivityLogSerializer(serializers.ModelSerializer):
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'baby', 'activity_type', 'activity_type_display',
            'description', 'duration_minutes', 'severity', 'metadata', 'timestamp'
        ]
        read_only_fields = ['timestamp']


class SensorReadingSerializer(serializers.ModelSerializer):
    is_temperature_alert = serializers.ReadOnlyField()
    is_humidity_alert = serializers.ReadOnlyField()

    class Meta:
        model = SensorReading
        fields = [
            'id', 'baby', 'temperature', 'humidity',
            'is_temperature_alert', 'is_humidity_alert', 'timestamp'
        ]
        read_only_fields = ['timestamp']


class DailySummarySerializer(serializers.Serializer):
    date = serializers.DateField()
    total_sleep_minutes = serializers.IntegerField()
    total_awake_minutes = serializers.IntegerField()
    cry_count = serializers.IntegerField()
    motion_count = serializers.IntegerField()
    avg_temperature = serializers.FloatField()
    avg_humidity = serializers.FloatField()
    activities = ActivityLogSerializer(many=True)