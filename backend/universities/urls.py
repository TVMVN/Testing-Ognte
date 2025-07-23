from django.urls import path,include
from .auth_views import UniversityProfileView, UniversityListView
from .auth_views import UniversityDashboardView
from rest_framework.routers import DefaultRouter
from .views import OverseerViewSet

router = DefaultRouter()
router.register(r'', OverseerViewSet, basename='university')

urlpatterns = [
    path('profile/', UniversityProfileView.as_view(), name='university-profile'),
    path('', UniversityListView.as_view(), name='university-list'),
    path('dashboard/stats/', UniversityDashboardView.as_view(), name='university-dashboard-stats'),
    path('', include(router.urls)),
]

