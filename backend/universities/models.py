from django.db import models
from users.models import User

class University(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="university_profile")
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    website = models.URLField()
    location = models.CharField(max_length=100)
    type = models.CharField(max_length=50)
    courses = models.TextField()
    year = models.IntegerField()
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='university_logos/', blank=True, null=True)
    
    def __str__(self):
        return self.name
