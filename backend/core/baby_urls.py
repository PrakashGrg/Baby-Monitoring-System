from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core import views

router = DefaultRouter()
router.register(r'', views.BabyProfileViewSet, basename='baby')

urlpatterns = [
    path('<int:baby_id>/activities/', views.ActivityLogListView.as_view(), name='baby-activities'),
    path('<int:baby_id>/summary/', views.daily_summary_view, name='baby-summary'),
    path('<int:baby_id>/sensor/simulate/', views.sensor_simulate_view, name='sensor-simulate'),
    path('<int:baby_id>/chart/weekly/', views.weekly_chart_view, name='weekly-chart'),
    path('', include(router.urls)),
]