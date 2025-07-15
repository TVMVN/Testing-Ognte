from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = (
        ('candidate' , 'Canditate'),
        ('recruiter', 'Recruiter'),
        ('university', 'Universitiy'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, db_index=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    
    password_reset_token = models.CharField(max_length=256, null=True, blank=True)
    password_reset_token_created = models.DateTimeField(null=True, blank=True)
    
    THEMES = (
        ('light', 'Light'),
        ('dark', 'Dark'),
    )

    theme = models.CharField(max_length=10, choices=THEMES, default='light')

     # New fields
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True, null=True)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    failed_login_attempts = models.IntegerField(default=0)
    account_locked_until = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['email']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.username} ({self.role})"

    def is_account_locked(self):
        if self.account_locked_until:
            return timezone.now() < self.account_locked_until
        return False


# New Notification Model
class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('welcome', 'Welcome'),
        ('profile_update', 'Profile Update'),
        ('password_change', 'Password Change'),
        ('login', 'Login Alert'),
        ('application', 'Application'),
        ('message', 'Message'),
        ('system', 'System'),
        ('application_submitted', 'Application Submitted'),
        ('job_offer', 'Job Offer'),
        ('general', 'General'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=200, choices=NOTIFICATION_TYPES)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.user.username}"

