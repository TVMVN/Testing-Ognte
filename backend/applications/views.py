from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import JobPost, Application, Salary
from .serializers import (
    JobPostingSerializer,
    JobPostingCreateSerializer,
    ApplicationSerializer,
    SalarySerializer
)
from recruiters.models import Recruiter
from candidates.models import Candidate
    



class DefaultPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class JobPostViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = DefaultPagination

    def get_serializer_class(self):
        if self.request.method in ['POST', 'PUT', 'PATCH']:
            return JobPostingCreateSerializer
        return JobPostingSerializer

    def get_queryset(self):
        user = self.request.user
        try:
            recruiter = user.recruiter_profile  # safer and matches your model
            return JobPost.objects.filter(recruiter=recruiter).order_by('-created_at')
        except Recruiter.DoesNotExist:
            return JobPost.objects.filter(
                is_active=True,
                application_deadline__gte=timezone.now().date()
            ).order_by('-created_at')



    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'recruiter' or not hasattr(user, 'recruiter_profile'):
            raise PermissionDenied("Only recruiters can post jobs.")
        serializer.save(recruiter=user.recruiter_profile)

    @action(detail=False, methods=['get'], url_path='top_jobs')
    def top_jobs(self, request):
        queryset = self.get_queryset()[:5]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='applications')
    def applications(self, request, pk=None):
        job_post = get_object_or_404(JobPost, pk=pk)

        if job_post.recruiter.user != request.user:
            return Response({'detail': 'Not authorized to view applications for this job.'},
                            status=status.HTTP_403_FORBIDDEN)

        applications = Application.objects.filter(job_post=job_post).order_by('-created_at')
        page = self.paginate_queryset(applications)
        serializer = ApplicationSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)


class ApplicationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ApplicationSerializer
    pagination_class = DefaultPagination

    def get_queryset(self):
        user = self.request.user
        if user.role == 'candidate' and hasattr(user, 'candidate_profile'):
            return Application.objects.filter(candidate=user.candidate_profile).order_by('-created_at')
        elif user.role == 'recruiter' and hasattr(user, 'recruiter_profile'):
            return Application.objects.filter(job_post__recruiter=user.recruiter_profile).order_by('-created_at')
        return Application.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'candidate' or not hasattr(user, 'candidate_profile'):
            raise PermissionDenied("Only candidates with profiles can apply to jobs.")
        serializer.save(candidate=user.candidate_profile)


class SalaryViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SalarySerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'recruiter' and hasattr(user, 'recruiter_profile'):
            return Salary.objects.filter(job_posts__recruiter=user.recruiter_profile).distinct()
        return Salary.objects.none()

class PublicJobPostListView(generics.ListAPIView):
    queryset = JobPost.objects.filter(is_active=True)  
    serializer_class = JobPostingSerializer
    permission_classes = [permissions.AllowAny]  
