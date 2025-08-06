from django.urls import path, include
from .auth_views import RecruiterProfileView, RecruiterListView
from rest_framework.routers import DefaultRouter
from recruiters.views import *

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

    #Applications_View
    path('all-applications/', AllRecruiterApplicationsView.as_view(), name='recruiter-all-applications'),

    path('jobs/<int:pk>/edit/', RecruiterEditJobPostView.as_view(), name='edit-job'),
    path('applications/<int:pk>/accept/', AcceptApplicationView.as_view(), name='accept-application'),
    
    path('applications/<int:pk>/reject/', RejectApplicationView.as_view(), name='reject-application'),


    path('accepted-candidates/', AcceptedCandidateListView.as_view(), name='accepted-candidates'),

]



