from rest_framework import generics, permissions
from .models import CandidateJobMatch
from .serializers import CandidateJobMatchSerializer
from django.db.models import F
from rest_framework.permissions import IsAuthenticated

class TopCandidatesForJobView(generics.ListAPIView):
    serializer_class = CandidateJobMatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        job_id = self.kwargs.get("job_id")
        return CandidateJobMatch.objects.filter(job_post_id=job_id).order_by('-total_score')


class AppliedJobsForCandidateView(generics.ListAPIView):
    serializer_class = CandidateJobMatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CandidateJobMatch.objects.filter(candidate__user=self.request.user)
