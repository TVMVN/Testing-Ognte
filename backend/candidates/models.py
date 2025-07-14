from django.db import models
from users.models import User

class Candidate(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
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

    
    def __str__(self):
        return f"{self.user.username} - Candidate"

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('application_submitted', 'Application Submitted'),
        ('profile_update', 'Profile Updated'),
        ('job_offer', 'Job Offer'),
        ('general', 'General'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=100)
    message = models.TextField()
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default='general')
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} -> {self.user.username}"