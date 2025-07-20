# import django_filters
# from .models import JobPost, Application

# class JobPostFilter(django_filters.FilterSet):
#     class Meta:
#         model = JobPost
#         fields = ['title', 'location', 'is_remote', 'is_active']

# class ApplicationFilter(django_filters.FilterSet):
#     class Meta:
#         model = Application
#         fields = ['status', 'job_post']

#     # application/filtering.py

import django_filters
from applications.models import JobPost, Application


class JobPostFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(field_name='title', lookup_expr='icontains')
    location = django_filters.CharFilter(field_name='location', lookup_expr='icontains')
    job_type = django_filters.CharFilter(field_name='job_type', lookup_expr='iexact')
    created_at = django_filters.DateFromToRangeFilter()

    class Meta:
        model = JobPost
        fields = ['title', 'location', 'job_type', 'created_at']


class ApplicationFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name='status', lookup_expr='iexact')
    job_post = django_filters.NumberFilter(field_name='job_post__id')
    candidate = django_filters.NumberFilter(field_name='candidate__id')
    applied_at = django_filters.DateFromToRangeFilter()

    class Meta:
        model = Application
        fields = ['status', 'job_post', 'candidate', 'applied_at']
