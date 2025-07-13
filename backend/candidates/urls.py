from django.urls import path
from .views import CandidateProfileView, UniversityCandidatesListView

urlpatterns = [
    path('profile/', CandidateProfileView.as_view(), name='candidate-profile'),
    path('university-candidates/', UniversityCandidatesListView.as_view(), name='university-candidates'),
]
