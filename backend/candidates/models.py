from django.db import models
from users.models import User


class Candidate(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='candidate_profile')
    professional_title = models.CharField(max_length=100)
    university = models.ForeignKey('universities.University', null=True, blank=True, on_delete=models.SET_NULL)
    degree = models.CharField(max_length=100)
    graduation_year = models.IntegerField()
    phone = models.CharField(max_length=20)
    city = models.CharField(max_length=100)
    gender = models.CharField(max_length=10)
    languages = models.CharField(max_length=200)
    employment_type = models.CharField(max_length=50)
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    skills = models.JSONField(default=list, blank=True)
    location = models.CharField(max_length=100)
    can_university_view = models.BooleanField(default=True)
    duration_of_internship = models.IntegerField()
    is_seeking = models.BooleanField(default=True)
    registered_with_overseer = models.BooleanField(default=False)
    seeking_job = models.BooleanField(default=True)
    cover_letter = models.TextField(blank=True, null=True)

    
    def __str__(self):
        return f"{self.user.username} - Candidate"
