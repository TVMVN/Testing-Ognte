import django_filters
from .models import JobPost, Application

class JobPostFilter(django_filters.FilterSet):
    class Meta:
        model = JobPost
        fields = ['title', 'location', 'is_remote', 'is_active']

class ApplicationFilter(django_filters.FilterSet):
    class Meta:
        model = Application
        fields = ['status', 'job_post']