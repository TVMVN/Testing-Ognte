
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import CandidateJobMatch
from .serializers import CandidateJobMatchSerializer
from candidates.permissions import IsCandidateUser
from recruiters.permissions import IsRecruiterUser

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from candidates.models import Candidate
from applications.models import JobPost
from matching.models import CandidateJobMatch
from matching.utils import calculate_skill_score, calculate_total_score

class RunMatchingEngine(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        candidates = Candidate.objects.all()
        job_posts = JobPost.active_jobs.all()

        match_count = 0

        for candidate in candidates:
            for job in job_posts:
                if CandidateJobMatch.objects.filter(candidate=candidate, job_post=job).exists():
                    continue

                professional_title_match = candidate.professional_title.strip().lower() == job.title.strip().lower()
                skill_score = calculate_skill_score(candidate.skills, job.required_skills)
                duration_match = candidate.duration_of_internship == job.duration_of_internship
                location_match = candidate.city.strip().lower() == job.location.strip().lower()
                industry_match = (
                    candidate.university and 
                    candidate.university.industry.lower() == job.industry.lower()
                )
                has_resume = bool(candidate.resume)

                match = CandidateJobMatch(
                    candidate=candidate,
                    job_post=job,
                    professional_title_match=professional_title_match,
                    skill_match_score=skill_score,
                    degree_match=True,  # Set proper logic if needed
                    location_match=location_match,
                    duration_match=duration_match,
                    industry_match=industry_match,
                    has_resume=has_resume,
                )
                calculate_total_score(match)
                match.save()
                match_count += 1

        return Response({"detail": f"Matching completed. {match_count} matches created."})




class CandidateMatchListView(generics.ListAPIView):
    serializer_class = CandidateJobMatchSerializer
    permission_classes = [permissions.IsAuthenticated, IsCandidateUser]

    def get_queryset(self):
        return CandidateJobMatch.objects.filter(candidate__user=self.request.user)


class RecruiterTopMatchesView(generics.ListAPIView):
    serializer_class = CandidateJobMatchSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiterUser]

    def get_queryset(self):
        recruiter = self.request.user.recruiter
        return CandidateJobMatch.objects.filter(job_post__recruiter=recruiter).order_by('-total_score')

