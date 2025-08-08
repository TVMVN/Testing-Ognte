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
from django.db.models import Count, Avg, Q
from collections import defaultdict


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
        university = request.user.university_profile
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
    
    
class UniversityStudentProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id=None):
        user = request.user
        university = getattr(user, 'university_profile', None)

        if not university:
            return Response({"detail": "Not a university user."}, status=403)

        # Base candidate queryset
        candidates = Candidate.objects.filter(
            can_university_view=True,
            university=university
        )

        # If specific student_id is provided, filter to that candidate only
        if student_id:
            candidates = candidates.filter(id=student_id)
            if not candidates.exists():
                return Response({"detail": "Student not found or not visible."}, status=404)

        # Optional filters for bulk view
        if not student_id:
            course = request.query_params.get('course')
            year = request.query_params.get('year')
            if course:
                candidates = candidates.filter(course__iexact=course)
            if year:
                candidates = candidates.filter(year=year)

        total = candidates.count()
        with_resume = candidates.exclude(Q(resume='') | Q(resume__isnull=True)).count()
        with_skills = candidates.exclude(Q(skills='') | Q(skills__isnull=True)).count()
        seeking_jobs = candidates.filter(seeking_job=True).count()

        applications = Application.objects.filter(candidate__in=candidates)

        accepted = applications.filter(status='accepted').count()
        rejected = applications.filter(status='rejected').count()
        no_response = applications.filter(status='offered').count()

        matched_candidate_ids = applications.values_list('candidate_id', flat=True).distinct()
        matched = len(matched_candidate_ids)
        unmatched = total - matched

        # Track latest status per candidate
        latest_status = defaultdict(lambda: "none")
        for app in applications.order_by('candidate_id', '-applied_at'):
            cid = app.candidate_id
            if latest_status[cid] == "none":
                latest_status[cid] = app.status

        student_breakdown = []
        for c in candidates:
            student_breakdown.append({
                "id": c.id,
                "name": c.user.get_full_name(),
                "email": c.user.email,
                "resume": "yes" if c.resume else "no",
                "skills": c.skills or "none",
                "seeking_job": c.seeking_job,
                "matched": c.id in matched_candidate_ids,
                "job_status": latest_status[c.id]
            })

        return Response({
            "summary": {
                "total_students_visible": total,
                "accepted_jobs": accepted,
                "rejected_offers": rejected,
                "no_response_offers": no_response,
                "still_seeking_jobs": seeking_jobs,
                "with_resume": with_resume,
                "with_skills": with_skills,
                "matched": matched,
                "unmatched": unmatched,
            },
            "breakdown": student_breakdown
        })