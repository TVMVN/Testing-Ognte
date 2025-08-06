from datetime import timedelta
from django.utils.timezone import now
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from django.conf import settings
from .models import Recruiter
from .permissions import IsRecruiterUser
from applications.models import JobPost, Application
from .pagination import DefaultPagination
from applications.serializers import (
    JobPostingSerializer,
    JobPostingCreateSerializer,
    ApplicationSerializer
)
from matching.models import CandidateJobMatch
from matching.serializers import CandidateJobMatchSerializer
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404

from applications.models import JobPost, Application
from applications.serializers import JobPostingCreateSerializer, ApplicationSerializer

from rest_framework import generics, permissions
from applications.models import Application
from .serializers import AcceptedCandidateSerializer

# -------------------------
# Unified JobPost ViewSet
# -------------------------


class UnifiedJobPostViewSet(viewsets.ModelViewSet):
    """
    Handles both recruiter and candidate interactions with JobPost:
    - Recruiters: Create, update, delete their own job posts
    - Candidates: View only active jobs
    """
   
    pagination_class = DefaultPagination

    def get_serializer_class(self):
        if self.request.method in ['POST', 'PUT', 'PATCH']:
            return JobPostingCreateSerializer
        return JobPostingSerializer

    def get_queryset(self):
        user = self.request.user

        # Recruiter: see all their jobs, with optional ?is_active=true/false filter
        if hasattr(user, 'recruiter_profile'):
            queryset = JobPost.objects.filter(recruiter=user.recruiter_profile)
            is_active = self.request.query_params.get('is_active')
            if is_active in ['true', 'false']:
                queryset = queryset.filter(is_active=(is_active == 'true'))
            return queryset.order_by('-created_at')

        # Candidate: see only active jobs
        return JobPost.objects.filter(
            is_active=True,
            application_deadline__gte=timezone.now().date()
        ).order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        if not hasattr(user, 'recruiter_profile'):
            raise PermissionDenied("Only recruiters can post jobs.")
        serializer.save(recruiter=user.recruiter_profile, is_active=True)

    def perform_update(self, serializer):
        user = self.request.user
        if not hasattr(user, 'recruiter_profile'):
            raise PermissionDenied("Only recruiters can update job posts.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if not hasattr(user, 'recruiter_profile') or instance.recruiter != user.recruiter_profile:
            raise PermissionDenied("Only the job owner can delete this job.")
        instance.delete()

    @action(detail=False, methods=['get'], url_path='top_jobs')
    def top_jobs(self, request):
        """Return top 5 active jobs (for candidate dashboard)"""
        queryset = self.get_queryset().filter(is_active=True)[:5]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='applications')
    def applications(self, request, pk=None):
        """
        View applications for a specific job (recruiters only)
        """
        job_post = get_object_or_404(JobPost, pk=pk)
        if not hasattr(request.user, 'recruiter_profile') or job_post.recruiter != request.user.recruiter_profile:
            return Response({'detail': 'Not authorized to view applications for this job.'},
                            status=status.HTTP_403_FORBIDDEN)

        applications = Application.objects.filter(job_post=job_post).order_by('-created_at')
        page = self.paginate_queryset(applications)
        serializer = ApplicationSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=True, methods=['post'], url_path='toggle-active')
    def toggle_active_status(self, request, pk=None):
        """
        Allow recruiters to manually toggle a job post's active state
        """
        job = get_object_or_404(JobPost, pk=pk)

        if not hasattr(request.user, 'recruiter_profile') or job.recruiter != request.user.recruiter_profile:
            return Response({'detail': 'Not authorized to toggle this job.'}, status=status.HTTP_403_FORBIDDEN)

        job.is_active = not job.is_active
        job.save()

        return Response({
            'id': job.id,
            'is_active': job.is_active,
            'message': f'Job post has been {"activated" if job.is_active else "deactivated"}.'
        })
    


# -----------------------------------------
# Employer/Recruiter Analytics ViewSet
# -----------------------------------------

class EmployerAnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsRecruiterUser]

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """
        Returns analytics for the recruiter:
        - Number of job posts
        - Applications per job
        - Weekly application trend
        """
        user = request.user
        recruiter = getattr(user, 'recruiter', None)

        if not recruiter:
            return Response({'error': 'Not an employer'}, status=403)

        jobs = JobPost.objects.filter(recruiter=recruiter)

        job_count = jobs.count()
        applications_per_job = {
            job.id: Application.objects.filter(job_post=job).count()
            for job in jobs
        }

        one_week_ago = now() - timedelta(days=7)
        weekly_applications = (
            Application.objects
            .filter(job_post__in=jobs, applied_at__gte=one_week_ago)
            .annotate(day=TruncDate('applied_at'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )

        return Response({
            'job_count': job_count,
            'applications_per_job': applications_per_job,
            'weekly_applications': list(weekly_applications),
        })

# -----------------------------------------
# Recruiter Dashboard Candidate Matches
# -----------------------------------------

class RecruiterDashboardMatchesView(APIView):
    """
    Fetch top matched candidates for all jobs posted by a recruiter
    """
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

class AllRecruiterApplicationsView(APIView):
    permission_classes = [IsAuthenticated, IsRecruiterUser]

    def get(self, request):
        recruiter = request.user.recruiter_profile
        job_posts = JobPost.objects.filter(recruiter=recruiter)
        applications = Application.objects.filter(job_post__in=job_posts).select_related('candidate', 'job_post')
        serializer = ApplicationSerializer(applications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RecruiterEditJobPostView(generics.RetrieveUpdateAPIView):
    queryset = JobPost.objects.all()
    serializer_class = JobPostingCreateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        try:
            recruiter = self.request.user.recruiter_profile
        except AttributeError:
            return JobPost.objects.none()
        return JobPost.objects.filter(recruiter=recruiter)


class AcceptApplicationView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    
class AcceptApplicationView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            recruiter = request.user.recruiter_profile
        except:
            return Response({'detail': 'User is not a recruiter.'}, status=403)

        application = get_object_or_404(Application, id=pk, job_post__recruiter=recruiter)

        if application.status == 'accepted':
            return Response({'detail': 'Application already accepted.'}, status=400)

        # Update application status
        application.status = 'accepted'
        application.save()

        # Prepare email
        candidate_email = application.candidate.user.email
        job_title = application.job_post.title
        accept_link = f"{settings.FRONTEND_URL}/api/candidates/applications/{application.id}/accept-offer/"
        deny_link = f"{settings.FRONTEND_URL}/api/candidates/applications/{application.id}/deny-offer/"

        html_message = f"""
        <h2>You've been offered a job: {job_title}</h2>
        <p>Click below to accept or decline the offer:</p>
        <p><a href="{accept_link}" style="padding:10px 20px; background:green; color:white; text-decoration:none;">Accept Offer</a></p>
        <p><a href="{deny_link}" style="padding:10px 20px; background:red; color:white; text-decoration:none;">Deny Offer</a></p>
        """

        send_mail(
            subject=f"Job Offer for {job_title}",
            message="You've been offered a job.",
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[candidate_email],
        )

        return Response({'detail': 'Application accepted and job offer sent to candidate.'})

# 3. Reject Application
class RejectApplicationView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from applications.models import Application

class RejectApplicationView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            recruiter = request.user.recruiter_profile
        except:
            return Response({'detail': 'User is not a recruiter.'}, status=403)

        application = get_object_or_404(Application, id=pk, job_post__recruiter=recruiter)

        if application.status == 'rejected':
            return Response({'detail': 'Application is already rejected.'}, status=400)

        application.status = 'rejected'
        application.save()

        return Response({'detail': 'Application rejected successfully.'})




class AcceptedCandidateListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiterUser]
    serializer_class = AcceptedCandidateSerializer

    def get_queryset(self):
        # Only show accepted candidates for job posts owned by this recruiter
        recruiter = self.request.user.recruiter_profile
        return Application.objects.filter(
            job_post__recruiter=recruiter,
            status='accepted'
        ).select_related('candidate__user', 'job_post')
