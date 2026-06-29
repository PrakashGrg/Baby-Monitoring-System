from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('me/', views.me_view, name='me'),
    path('profile/update/', views.update_profile_view, name='profile-update'),
]