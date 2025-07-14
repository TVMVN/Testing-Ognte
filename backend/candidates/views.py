from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Candidate
from .serializers import CandidateProfileSerializer, MyApplicationSerializer
from .permissions import IsCandidateUser
from applications.models import JobPost, Application
from applications.serializers import ApplicationCreateSerializer
from .utils import create_notification

class MyApplicationsView(generics.ListAPIView):
    serializer_class = MyApplicationSerializer
    permission_classes = [IsAuthenticated, IsCandidateUser]

    def get_queryset(self):
        return Application.objects.filter(candidate=self.request.user.candidate_profile)


class ApplyToJobView(generics.CreateAPIView):
    serializer_class = ApplicationCreateSerializer
    permission_classes = [IsAuthenticated, IsCandidateUser]

    def get_serializer_context(self):
        """Pass candidate and job_post via context to serializer."""
        context = super().get_serializer_context()
        context['candidate'] = self.request.user.candidate
        context['job_post'] = get_object_or_404(JobPost, id=self.kwargs['job_id'])
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({'detail': 'Application submitted.'}, status=status.HTTP_201_CREATED)
    
    def perform_create(self, serializer):
        candidate = self.request.user.candidate
        job_post = get_object_or_404(JobPost, id=self.kwargs['job_id'])
        application = serializer.save(candidate=candidate, job_post=job_post)
    
        # 🔔 Create notification
        create_notification(
            self.request.user,
            "Application Submitted",
            f"You applied for '{job_post.title}' successfully.",
            "application_submitted"
        )
    
        recruiter_user = job_post.recruiter.user
        candidate_name = self.request.user.get_full_name() or self.request.user.username
    
        create_notification(
            recruiter_user,
            "New Application Received",
            f"{candidate_name} applied for your job '{job_post.title}'.",
            "application_received"
        )