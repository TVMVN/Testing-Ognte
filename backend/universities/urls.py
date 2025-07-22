from django.urls import path
from .views import UniversityProfileView, UniversityListView
from .views import UniversityDashboardView


urlpatterns = [
    path('profile/', UniversityProfileView.as_view(), name='university-profile'),
    path('', UniversityListView.as_view(), name='university-list'),
    path('dashboard/stats/', UniversityDashboardView.as_view(), name='university-dashboard-stats'),

]

