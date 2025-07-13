from django.db import models
from users.models import User

class Recruiter(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    company_name = models.CharField(max_length=100)
    recruiter_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    website = models.URLField(blank=True, null=True)
    location = models.CharField(max_length=100)
    industry = models.CharField(max_length=100)
    company_size = models.CharField(max_length=50)
    bio = models.TextField(blank=True)
    logo = models.ImageField(upload_to='logos/', blank=True, null=True)
