from rest_framework import generics, permissions, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils.timezone import now
from datetime import timedelta
from django.db.models import Count
from django.db.models.functions import TruncDate
from .models import Recruiter
from .permissions import IsRecruiterUser
from applications.models import JobPost, Application
from .serializers import JobPostSerializer
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils.timezone import now
from datetime import timedelta
from django.db.models import Count
from django.db.models.functions import TruncDate
from matching.models import CandidateJobMatch
from matching.serializers import CandidateJobMatchSerializer

from .models import Recruiter
from .permissions import IsRecruiterUser
from applications.models import JobPost, Application

class JobPostViewSet(viewsets.ModelViewSet):
    serializer_class = JobPostSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiterUser]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'recruiter'):
            return JobPost.objects.filter(recruiter=user.recruiter)
        return JobPost.objects.none()

    def perform_create(self, serializer):
        serializer.save(recruiter=self.request.user.recruiter)

class EmployerAnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsRecruiterUser]

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        user = request.user
        if not hasattr(user, 'recruiter'):
            return Response({'error': 'Not an employer'}, status=403)

        recruiter = user.recruiter
        jobs = JobPost.objects.filter(recruiter=recruiter)

        job_count = jobs.count()
        applications_per_job = {
            job.id: Application.objects.filter(job_post=job).count()
            for job in jobs
        }

        one_week_ago = now() - timedelta(days=7)
        week_apps = Application.objects.filter(
            job_post__in=jobs,
            applied_at__gte=one_week_ago
        ).annotate(
            day=TruncDate('applied_at')
        ).values('day').annotate(
            count=Count('id')
        ).order_by('day')

        return Response({
            'job_count': job_count,
            'applications_per_job': applications_per_job,
            'weekly_applications': list(week_apps)
        })

class RecruiterDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsRecruiterUser]

    def get(self, request):
        recruiter = getattr(request.user, 'recruiter', None)
        if not recruiter:
            return Response({'error': 'Not a recruiter'}, status=403)

        # Get recruiter's job posts
        job_posts = JobPost.objects.filter(recruiter=recruiter)
        job_ids = job_posts.values_list('id', flat=True)

        # Applications data
        applications = Application.objects.filter(job_post__in=job_ids)
        total_jobs = job_posts.count()
        total_applications = applications.count()
        accepted = applications.filter(status='accepted').count()
        rejected = applications.filter(status='rejected').count()

        # Applications per job
        applications_per_job = {
            job.title: applications.filter(job_post=job).count()
            for job in job_posts
        }

        # Weekly application count (last 7 days)
        one_week_ago = now() - timedelta(days=7)
        weekly_applications = (
            applications.filter(applied_at__gte=one_week_ago)
            .annotate(day=TruncDate('applied_at'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )

        return Response({
            'total_jobs': total_jobs,
            'total_applications': total_applications,
            'accepted_applications': accepted,
            'rejected_applications': rejected,
            'applications_per_job': applications_per_job,
            'weekly_applications': weekly_applications
        })

from matching.utils import match_jobpost_to_candidates

# recruiters/views/dashboard.py

class RecruiterDashboardMatchesView(APIView):
    permission_classes = [IsAuthenticated, IsRecruiterUser]

    def get(self, request):
        recruiter = request.user.recruiter
        job_posts = JobPost.objects.filter(recruiter=recruiter)
        
        results = []
        for job in job_posts:
            matches = CandidateJobMatch.objects.filter(job_post=job).order_by('-total_score')[:10]
            serialized_matches = CandidateJobMatchSerializer(matches, many=True).data
            results.append({
                'job_post': job.title,
                'job_id': job.id,
                'top_candidates': serialized_matches
            })

        return Response({'recruiter_matches': results})
