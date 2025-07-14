from django.urls import path
from .auth_views import CandidateProfileView, UniversityCandidatesListView
from . import views
urlpatterns = [
    path('profile/', CandidateProfileView.as_view(), name='candidate-profile'),
    path('university-candidates/', UniversityCandidatesListView.as_view(), name='university-candidates'),
    path('my-applications/', views.MyApplicationsView.as_view(), name='my-applications'),
    path('apply/<int:job_id>/', views.ApplyToJobView.as_view(), name='apply-job'),
]
