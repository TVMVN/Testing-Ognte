from django.urls import path
from .views import (
    RunMatchingEngine,
    CandidateMatchListView,
    RecruiterTopMatchesView,
)

urlpatterns = [
    path('match/run/', RunMatchingEngine.as_view(), name='run-matching-engine'),
    path('match/candidate/', CandidateMatchListView.as_view(), name='candidate-matches'),
    path('match/recruiter/', RecruiterTopMatchesView.as_view(), name='recruiter-top-matches'),
]
