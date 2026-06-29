from django.urls import path
from . import views

urlpatterns = [
    path('<int:baby_id>/frame/', views.detect_from_frame, name='detect-frame'),
    path('<int:baby_id>/simulate/', views.simulate_detection, name='detect-simulate'),
    path('<int:baby_id>/events/', views.recent_events, name='detect-events'),
]