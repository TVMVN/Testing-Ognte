from django.urls import path
from .auth_views import RecruiterProfileView, RecruiterListView
from .views import JobPostViewSet, EmployerAnalyticsViewSet

urlpatterns = [
    #Authentication Routes
    path('profile/', RecruiterProfileView.as_view(), name='recruiter-profile'),
    path('', RecruiterListView.as_view(), name='recruiter-list'),

    #Application Routes
    path('jobs/', JobPostViewSet.as_view({'get': 'list', 'post': 'create'}), name='jobpost-list-create'),
    path('jobs/<int:pk>/', JobPostViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='jobpost-detail'),
    
    path('analytics/', EmployerAnalyticsViewSet.as_view({'get': 'list'}), name='employer-analytics'),
]
