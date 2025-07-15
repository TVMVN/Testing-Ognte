from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .auth_views import RecruiterProfileView, RecruiterListView
from .views import JobPostViewSet, EmployerAnalyticsViewSet
urlpatterns = [
    path('profile/', RecruiterProfileView.as_view(), name='recruiter-profile'),
    path('', RecruiterListView.as_view(), name='recruiter-list'),
]
router = DefaultRouter()
router.register('jobs', JobPostViewSet, basename='jobpost')
router.register('analytics', EmployerAnalyticsViewSet, basename='employer-analytics')

urlpatterns = [
    path('', include(router.urls)),
]