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


# mentors/views.py

# class MentorApplyView(generics.CreateAPIView):
#     serializer_class = MentorApplicationSerializer
#     permission_classes = [IsAuthenticated]  # Assume user is a mentor

#     def perform_create(self, serializer):
#         application = get_object_or_404(Application, pk=self.kwargs['application_id'])
#         serializer.save(mentor=self.request.user, application=application)


# class MentorDecisionView(generics.UpdateAPIView):
#     queryset = MentorApplication.objects.all()
#     serializer_class = MentorApplicationSerializer
#     permission_classes = [IsAuthenticated, IsRecruiterUser]

#     def update(self, request, *args, **kwargs):
#         mentor_app = self.get_object()
#         decision = request.data.get('status')
#         if decision not in ['accepted', 'rejected']:
#             return Response({'detail': 'Invalid status.'}, status=400)
#         mentor_app.status = decision
#         mentor_app.save()
#         return Response({'detail': f'Mentor application {decision}.'})
