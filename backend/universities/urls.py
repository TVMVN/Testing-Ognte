from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .auth_views import UniversityProfileView, UniversityListView, UniversityStudentProgressView, UniversityDashboardView
from .views import OverseerViewSet
from .views import RecruiterEngagementHubViewSet

router = DefaultRouter()
router.register(r'student-overview', OverseerViewSet, basename='student-overview')
router.register(r'recruiter-engagement', RecruiterEngagementHubViewSet, basename='recruiter-engagement')



urlpatterns = [
    path('profile/', UniversityProfileView.as_view(), name='university-profile'),
    path('', UniversityListView.as_view(), name='university-list'),
    path('dashboard/stats/', UniversityDashboardView.as_view(), name='university-dashboard-stats'),
    path('student-progress/', UniversityStudentProgressView.as_view(), name='university-student-progress'),
    path('student-progress/<int:student_id>/', UniversityStudentProgressView.as_view(), name='university-student-progress-detail'),
    path('', include(router.urls)),  # DRF will register the action routes
]
