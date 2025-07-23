from rest_framework import viewsets, permissions, filters as drf_filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.utils.timezone import now
from django.db.models import Q, Count
from django.http import HttpResponse
import csv
from datetime import datetime

from candidates.models import Candidate
from applications.models import Application
from recruiters.models import Recruiter
from applications.models import JobPost


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class OverseerViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]
    pagination_class = StandardResultsSetPagination

    def filter_by_date(self, queryset, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        return queryset

    def export_as_csv(self, data, fieldnames):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="insights.csv"'

        writer = csv.DictWriter(response, fieldnames=fieldnames)
        writer.writeheader()
        for row in data:
            writer.writerow(row)

        return response

    def get_registered_candidates(self, request):
        """Returns only candidates registered with overseer, filtered by optional date."""
        queryset = Candidate.objects.filter(registered_with_overseer=True)
        return self.filter_by_date(queryset, request)

    @action(detail=False, methods=['get'])
    def employment_insights(self, request):
        candidates = self.get_registered_candidates(request)

        employed_count = Application.objects.filter(
            status='accepted',
            candidate__in=candidates
        ).count()

        no_resume_count = candidates.filter(Q(resume__isnull=True) | Q(resume='')).count()
        seeking_jobs_count = candidates.filter(seeking_job=True).count()

        lacking_skills = 0
        for candidate in candidates:
            if not candidate.skills:
                lacking_skills += 1
            else:
                has_skills = any(
                    job.skills and skill.lower() in job.skills.lower()
                    for skill in candidate.skills.split(',')
                    for job in JobPost.objects.filter(is_active=True)
                )
                if not has_skills:
                    lacking_skills += 1

        insights = {
            "employed": employed_count,
            "no_resume": no_resume_count,
            "seeking_jobs": seeking_jobs_count,
            "lacking_skills": lacking_skills,
        }

        if request.query_params.get('format') == 'csv':
            return self.export_as_csv([insights], list(insights.keys()))

        return Response(insights)

    @action(detail=False, methods=['get'])
    def recruiters_by_interns(self, request):
        month = request.query_params.get('month')
        year = request.query_params.get('year')

        qs = Recruiter.objects.annotate(
            intern_count=Count('jobpost__applications', filter=Q(jobpost__applications__job_type='intern'))
        ).filter(intern_count__gt=0)

        if month and year:
            qs = qs.filter(jobpost__created_at__month=month, jobpost__created_at__year=year)

        data = [
            {
                "recruiter": recruiter.user.get_full_name() or recruiter.user.username,
                "interns_recruited": recruiter.intern_count
            }
            for recruiter in qs
        ]

        if request.query_params.get('format') == 'csv':
            return self.export_as_csv(data, ["recruiter", "interns_recruited"])

        return Response(data)

    @action(detail=False, methods=['get'])
    def detailed_breakdown(self, request):
        candidates = self.get_registered_candidates(request)

        first_10_employed = Application.objects.filter(
            status='accepted',
            candidate__in=candidates
        ).order_by('applied_at')[:10]

        have_skills_resume = candidates.filter(~Q(resume=''), ~Q(skills=''))\
            .exclude(application__status='accepted')\
            .distinct()

        no_job_no_resume_or_skills = candidates.filter(Q(resume='') | Q(resume__isnull=True))\
            .filter(Q(skills='') | Q(skills__isnull=True))\
            .exclude(application__status='accepted')\
            .distinct()

        result = {
            "first_10_employed": [
                {
                    "name": a.candidate.user.get_full_name(),
                    "email": a.candidate.user.email,
                    "applied_at": a.applied_at
                } for a in first_10_employed
            ],
            "have_skills_and_resume_but_unemployed": [
                {
                    "name": c.user.get_full_name(),
                    "email": c.user.email,
                    "skills": c.skills
                } for c in have_skills_resume
            ],
            "no_skills_and_resume_and_unemployed": [
                {
                    "name": c.user.get_full_name(),
                    "email": c.user.email
                } for c in no_job_no_resume_or_skills
            ]
        }

        return Response(result)