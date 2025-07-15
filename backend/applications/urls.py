from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobPostViewSet, ApplicationViewSet, SalaryViewSet # Add SalaryViewSet here

router = DefaultRouter()
router.register(r'jobs', JobPostViewSet, basename='jobpost')
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'salaries', SalaryViewSet, basename='salary')  # Register the salary endpoint

urlpatterns = [
    path('', include(router.urls)),
]
