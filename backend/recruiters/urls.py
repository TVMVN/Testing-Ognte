from django.urls import path, include
from .auth_views import RecruiterProfileView, RecruiterListView
from rest_framework.routers import DefaultRouter
from recruiters.views import UnifiedJobPostViewSet, EmployerAnalyticsViewSet, RecruiterDashboardMatchesView

router = DefaultRouter()
router.register(r'jobs', UnifiedJobPostViewSet, basename='recruiter-jobs')
router.register(r'analytics', EmployerAnalyticsViewSet, basename='employer-analytics')

urlpatterns = [
    path('', include(router.urls)),

    # Authentication
    path('profile/', RecruiterProfileView.as_view(), name='recruiter-profile'),
    path('list/', RecruiterListView.as_view(), name='recruiter-list'),

    # Dashboard
    path('matches/', RecruiterDashboardMatchesView.as_view(), name='recruiter-matches'),
]
