from django.urls import path
from .auth_views import CandidateProfileView, UniversityCandidatesListView
from . import views
from django.urls import path
from .views import CandidateDashboardMatchesView
from .views import CandidateStatsView

urlpatterns = [
    path('profile/', CandidateProfileView.as_view(), name='candidate-profile'),
    path('university-candidates/', UniversityCandidatesListView.as_view(), name='university-candidates'),
    path('my-applications/', views.MyApplicationsView.as_view(), name='my-applications'),
    path('apply/<int:job_id>/', views.ApplyToJobView.as_view(), name='apply-job'),

    path('dashboard/matches/', CandidateDashboardMatchesView.as_view(), name='candidate-dashboard-matches'),
    path('dashboard/stats/', CandidateStatsView.as_view(), name='candidate-dashboard-stats'),
]

