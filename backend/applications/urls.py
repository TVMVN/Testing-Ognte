from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobPostViewSet, ApplicationViewSet, SalaryViewSet, PublicJobPostListView

router = DefaultRouter()
router.register(r'jobs', JobPostViewSet, basename='jobpost')
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'salaries', SalaryViewSet, basename='salary')

urlpatterns = [
    path('', include(router.urls)),
    path('jobs/<int:pk>/toggle-active/', JobPostViewSet.as_view({'post': 'toggle_active'})),
    path('public/jobs/' , PublicJobPostListView.as_view(), name='public-job-list'),
]
