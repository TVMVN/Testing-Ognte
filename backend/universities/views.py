from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist
from .models import University
from .serializers import UniversitySerializer
from .permissions import IsUniversityUser 
from users.utils import create_notification
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from universities.permissions import IsUniversityUser

from applications.models import Application
from matching.models import CandidateJobMatch
from candidates.models import Candidate
from universities.models import University
from django.db.models import Count, Avg



class UniversityProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UniversitySerializer
    permission_classes = [permissions.IsAuthenticated, IsUniversityUser]

    def get_object(self):
        try:
            return University.objects.select_related('user').get(user=self.request.user)
        except University.DoesNotExist:
            return Response(
                {'error': 'University profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            create_notification(
                request.user,
                'Profile Updated',
                'Your university profile has been updated successfully.',
                'profile_update'
            )
        return response


class UniversityListView(generics.ListAPIView):
    serializer_class = UniversitySerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = University.objects.select_related('user').filter(user__is_active=True)
        
        # Add search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
            
        # Add location filter
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(location__icontains=location)
            
        return queryset




class UniversityDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsUniversityUser]

    def get(self, request):
        university = request.user.university_profile.first()
        candidates = Candidate.objects.filter(university=university)
        applications = Application.objects.filter(candidate__in=candidates)
        matches = CandidateJobMatch.objects.filter(candidate__in=candidates)

        top_industries = matches.values("job_post__industry").annotate(
            count=Count("id")
        ).order_by("-count")[:3]

        top_skills = []  # Optional: if skills are in JSONField, do skill frequency processing separately

        return Response({
            "total_candidates": candidates.count(),
            "total_applications": applications.count(),
            "accepted_applications": applications.filter(status="accepted").count(),
            "rejected_applications": applications.filter(status="rejected").count(),
            "average_match_score": round(matches.aggregate(Avg("total_score"))['total_score__avg'] or 0, 2),
            "top_industries": top_industries
        })

