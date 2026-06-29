from django.urls import path
from . import views

urlpatterns = [
    path('register-token/', views.register_token),
    path('', views.list_notifications),
    path('<int:notif_id>/read/', views.mark_read),
    path('test/', views.create_test_notification),
    path('unread-count/', views.unread_count),
]