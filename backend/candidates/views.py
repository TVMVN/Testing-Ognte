from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from .models import Candidate
from .permissions import IsCandidateUser
from .serializers import CandidateProfileSerializer, MyApplicationSerializer
from .utils import create_notification

from candidates.serializers import ApplicationCreateSerializer  # ✅ Use the correct one
from applications.models import JobPost, Application
from matching.models import CandidateJobMatch
from matching.serializers import CandidateJobMatchSerializer


class MyApplicationsView(generics.ListAPIView):
    serializer_class = MyApplicationSerializer
    permission_classes = [IsAuthenticated, IsCandidateUser]

    def get_queryset(self):
        return Application.objects.filter(candidate=self.request.user.candidate_profile.first())


class ApplyToJobView(APIView):
    permission_classes = [IsAuthenticated, IsCandidateUser]

    def post(self, request, job_id, *args, **kwargs):
        candidate = getattr(request.user, 'candidate_profile', None)
        if not candidate:
            return Response({'error': 'Candidate profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        job_post = JobPost.objects.filter(pk=job_id, is_active=True).first()
        if not job_post:
            return Response({'error': 'Job post not found or inactive.'}, status=status.HTTP_404_NOT_FOUND)

        context = {'request': request, 'candidate': candidate, 'job_post': job_post}
        serializer = ApplicationCreateSerializer(data=request.data, context=context)

        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Application submitted successfully.'}, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CandidateDashboardMatchesView(APIView):
    permission_classes = [IsAuthenticated, IsCandidateUser]

    def get(self, request):
        candidate = request.user.candidate_profile.first()
        if not candidate:
            return Response({'error': 'Candidate profile not found.'}, status=404)

        matches = CandidateJobMatch.objects.filter(candidate=candidate).order_by('-total_score')[:10]
        serializer = CandidateJobMatchSerializer(matches, many=True)
        return Response({'top_matches': serializer.data})


class CandidateStatsView(APIView):
    permission_classes = [IsAuthenticated, IsCandidateUser]

    def get(self, request):
        candidate = request.user.candidate_profile.first()
        applications = Application.objects.filter(candidate=candidate)
        matches = CandidateJobMatch.objects.filter(candidate=candidate)

        stats = {
            "total_applications": applications.count(),
            "accepted_applications": applications.filter(status="accepted").count(),
            "rejected_applications": applications.filter(status="rejected").count(),
            "total_matches": matches.count(),
            "top_matched_jobs": [
                {
                    "job_title": match.job_post.title,
                    "score": match.total_score
                }
                for match in matches.order_by("-total_score")[:5]
            ]
        }
        return Response(stats)


class ToggleUniversityViewPermission(APIView):
    permission_classes = [IsAuthenticated, IsCandidateUser]

    def post(self, request):
        candidate = getattr(request.user, 'candidate_profile', None)
        if not candidate:
            return Response({'error': 'Candidate profile not found.'}, status=404)

        candidate.can_university_view = not candidate.can_university_view
        candidate.save()

        return Response({
            'can_university_view': candidate.can_university_view,
            'message': 'University view permission updated.'
        }, status=200)
