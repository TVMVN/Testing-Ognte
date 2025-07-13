from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import *

urlpatterns = [
    # Authentication
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # Registration
    path('register/candidate/', CandidateRegisterView.as_view(), name='candidate-register'),
    path('register/recruiter/', RecruiterRegisterView.as_view(), name='recruiter-register'),
    path('register/university/', UniversityRegisterView.as_view(), name='university-register'),
    
    # User Profile
    path('theme/', UserThemePreferenceView.as_view(), name='user-theme-preference'),
    
    # Notifications
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:notification_id>/read/', NotificationMarkReadView.as_view(), name='notification-read'),
    path('notifications/read-all/', NotificationMarkAllReadView.as_view(), name='notification-read-all'),

    #Account Settings
    path("forgot-password/", ForgotPasswordView.as_view(), name="password_reset"),
    path("reset-password/<uidb64>/<token>/", ResetPasswordView.as_view(), name="password_reset_confirm"),
    path("change-password/", ChangePasswordView.as_view(), name="password_change"),
    path("delete-account/", DeleteAccountView.as_view(), name="delete_account"),
]