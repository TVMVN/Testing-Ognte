from django.urls import path
from .views import (
    RunMatchingEngine,
    CandidateMatchListView,
    RecruiterTopMatchesView,
    candidate_job_matches,
    job_candidate_matches,
)

urlpatterns = [
    path("engine/run/", RunMatchingEngine.as_view(), name="run-matching"),
    path("candidate/matches/", CandidateMatchListView.as_view(), name="candidate-matches"),
    path("recruiter/matches/", RecruiterTopMatchesView.as_view(), name="recruiter-matches"),
    path("candidates/<int:candidate_id>/matches/", candidate_job_matches, name="candidate-top-matches"),
    path("recruiters/jobs/<int:job_id>/matches/", job_candidate_matches, name="job-top-matches"),
]
