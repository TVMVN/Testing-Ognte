from django.urls import path
from .views import UniversityProfileView, UniversityListView


urlpatterns = [
    path('profile/', UniversityProfileView.as_view(), name='university-profile'),
    path('', UniversityListView.as_view(), name='university-list')
  
]
