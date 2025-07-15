from rest_framework import viewsets, permissions, filters as drf_filters
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from django.utils.timezone import now, timedelta
from django_filters.rest_framework import DjangoFilterBackend
from .models import JobPost, Application
from .serializers import (
    JobSerializer, JobPostingSerializer, JobPostingCreateSerializer,
    ApplicationSerializer, ApplicationCreateSerializer,
    ApplicationDetailSerializer, ApplicationStatusUpdateSerializer
)
from .filtering import JobPostFilter, ApplicationFilter
from recruiters.models import Recruiter
from .models import Salary
from .serializers import SalarySerializer
from .permissions import IsRecruiter
from rest_framework.exceptions import PermissionDenied


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class JobPostViewSet(viewsets.ModelViewSet):
    queryset = JobPost.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]
    filter_backends = [DjangoFilterBackend, drf_filters.OrderingFilter, drf_filters.SearchFilter]
    filterset_class = JobPostFilter
    search_fields = ['title', 'description', 'skills']
    ordering_fields = ['created_at', 'title']
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return JobPostingCreateSerializer
        return JobPostingSerializer

    def perform_create(self, serializer):
        from recruiters.models import Recruiter  # ✅ make sure this import is there

def perform_create(self, serializer):
    user = self.request.user

    if user.role != 'recruiter':
        raise PermissionDenied("Only recruiters can post jobs.")
    recruiter, created = Recruiter.objects.get_or_create(user=user)
    serializer.save(recruiter=recruiter)

       

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def top_jobs(self, request):
        user = request.user
        if hasattr(user, 'recruiter'):
            jobs = JobPost.objects.filter(recruiter=user.recruiter)
            data = jobs.annotate(application_count=Count('applications')) \
                       .order_by('-application_count')[:5] \
                       .values('title', 'application_count')
            return Response(data)
        return Response(status=403)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def applications(self, request, pk=None):
        job = self.get_object()
        applications = job.applications.all()
        serializer = ApplicationDetailSerializer(applications, many=True)
        return Response(serializer.data)


class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, drf_filters.OrderingFilter, drf_filters.SearchFilter]
    filterset_class = ApplicationFilter
    search_fields = ['status']
    ordering_fields = ['applied_at']
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.action == 'create':
            return ApplicationCreateSerializer
        elif self.action in ['partial_update', 'update']:
            return ApplicationStatusUpdateSerializer
        return ApplicationDetailSerializer

    def perform_create(self, serializer):
        candidate = self.request.user.candidate
        serializer.save(candidate=candidate)

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'candidate'):
            return Application.objects.filter(candidate=user.candidate)
        elif hasattr(user, 'recruiter'):
            return Application.objects.filter(job_post__recruiter=user.recruiter)
        return Application.objects.none()

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def status_summary(self, request):
        user = request.user
        if hasattr(user, 'recruiter'):
            qs = Application.objects.filter(job_post__recruiter=user.recruiter)
        elif hasattr(user, 'candidate'):
            qs = Application.objects.filter(candidate=user.candidate)
        else:
            return Response(status=403)

        summary = qs.values('status').annotate(count=Count('status'))
        return Response({item['status']: item['count'] for item in summary})

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def trend(self, request):
        user = request.user
        days = int(request.query_params.get('days', 7))
        start_date = now().date() - timedelta(days=days)

        if hasattr(user, 'recruiter'):
            qs = Application.objects.filter(job_post__recruiter=user.recruiter, applied_at__date__gte=start_date)
        elif hasattr(user, 'candidate'):
            qs = Application.objects.filter(candidate=user.candidate, applied_at__date__gte=start_date)
        else:
            return Response(status=403)

        trend_data = qs.extra({'day': "date(applied_at)"}).values('day').annotate(count=Count('id')).order_by('day')
        return Response(trend_data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def comparison(self, request):
        user = request.user
        range1_start = request.query_params.get('range1_start')
        range1_end = request.query_params.get('range1_end')
        range2_start = request.query_params.get('range2_start')
        range2_end = request.query_params.get('range2_end')

        if not all([range1_start, range1_end, range2_start, range2_end]):
            return Response({"error": "All date ranges must be provided."}, status=400)

        base_filter = {}
        if hasattr(user, 'recruiter'):
            base_filter['job_post__recruiter'] = user.recruiter
        elif hasattr(user, 'candidate'):
            base_filter['candidate'] = user.candidate
        else:
            return Response(status=403)

        r1_count = Application.objects.filter(
            **base_filter,
            applied_at__date__gte=range1_start,
            applied_at__date__lte=range1_end
        ).count()

        r2_count = Application.objects.filter(
            **base_filter,
            applied_at__date__gte=range2_start,
            applied_at__date__lte=range2_end
        ).count()

        return Response({
            "range1": {"start": range1_start, "end": range1_end, "count": r1_count},
            "range2": {"start": range2_start, "end": range2_end, "count": r2_count}
        })

class SalaryViewSet(viewsets.ModelViewSet):
    queryset = Salary.objects.all()
    serializer_class = SalarySerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]
