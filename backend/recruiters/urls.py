from django.urls import path
from .views import RecruiterProfileView, RecruiterListView

urlpatterns = [
    path('profile/', RecruiterProfileView.as_view(), name='recruiter-profile'),
    path('', RecruiterListView.as_view(), name='recruiter-list'),
]
