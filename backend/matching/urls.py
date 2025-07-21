from django.urls import path
from .views import TopCandidatesForJobView, AppliedJobsForCandidateView

urlpatterns = [
    path('jobs/<int:job_id>/top-candidates/', TopCandidatesForJobView.as_view(), name='top-candidates'),
    path('candidates/applied-jobs/', AppliedJobsForCandidateView.as_view(), name='applied-jobs'),
]