from django.db import models
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from django.utils.timezone import now
from candidates.models import Candidate
from recruiters.models import Recruiter

class ActiveJobManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)

class Salary(models.Model):
    STATUS_CHOICES = [
        ('paid', 'Paid'),
        ('unpaid', 'Unpaid'),
    ]
    FREQUENCY_CHOICES = [
        ('monthly', 'Monthly'),
        ('weekly', 'Weekly'),
        ('daily', 'Daily'),
        ('hourly', 'Hourly'),
    ]
    CURRENCY_CHOICES = [
        ('naira', 'Naira'),
        ('dollar', 'Dollar'),
        ('euro', 'Euro'),
        ('pound', 'Pound'),
    ]

    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=20, choices=CURRENCY_CHOICES, default='naira')
    status = models.CharField(max_length=6, choices=STATUS_CHOICES, default='unpaid')
    payment_frequency = models.CharField(max_length=7, choices=FREQUENCY_CHOICES, default='monthly')

    def __str__(self):
        return f"{self.status} - {self.amount}{self.currency} / {self.payment_frequency}"

from django.db import models
from recruiters.models import Recruiter
from .models import Salary  # adjust if needed

class ActiveJobManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)

class JobPost(models.Model):
    recruiter = models.ForeignKey(Recruiter, on_delete=models.CASCADE, related_name='job_posts')
    title = models.CharField(max_length=100)
    description = models.TextField()
    location = models.CharField(max_length=100, default='Remote')
    skills = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_remote = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    application_deadline = models.DateField(null=True, blank=True)

    # 🔁 Updated for reusability
    salary = models.ForeignKey(Salary, on_delete=models.SET_NULL, null=True, blank=True, related_name='job_posts')
    duration_of_internship = models.CharField(max_length=100, null=True, blank=True)

    # ✅ Dual manager pattern
    objects = models.Manager()        
    active_jobs = ActiveJobManager()  

    def __str__(self):
        return self.title


    class Meta:
        ordering = ['-created_at']

    def clean(self):
        if self.application_deadline and self.application_deadline < now().date():
            raise ValidationError("Deadline cannot be in the past.")

    def has_expired(self):
        return self.application_deadline and self.application_deadline < now().date()

    def __str__(self):
        return f"{self.title} by {self.recruiter.user.email}"

class Application(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    job_post = models.ForeignKey(JobPost, on_delete=models.CASCADE, related_name='applications')
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='applications')
    resume = models.FileField(
        upload_to='resumes/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])]
    )
    cover_letter = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('candidate', 'job_post')
        ordering = ['-applied_at']

    def __str__(self):
        return f"{self.candidate.user.email} → {self.job_post.title} on {self.applied_at.strftime('%Y-%m-%d %H:%M')}"


    def clean(self):
        if self.status == 'accepted' and not self.resume:
            raise ValidationError("Accepted applications must include a resume.")
