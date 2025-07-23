from django.db import models
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from django.utils import timezone

from candidates.models import Candidate
from recruiters.models import Recruiter


# ------------------ Managers ------------------

class ActiveJobManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)


# ------------------ Salary Model ------------------

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
        return f"{self.amount} {self.currency} ({self.status}, {self.payment_frequency})"


# ------------------ JobPost Model ------------------

class JobPost(models.Model):
    recruiter = models.ForeignKey(Recruiter, on_delete=models.CASCADE, related_name='job_posts')
    title = models.CharField(max_length=100)
    description = models.TextField()
    location = models.CharField(max_length=100, default='Remote')
    is_remote = models.BooleanField(default=False)
    required_skills = models.JSONField(default=list, blank=True)
    industry = models.CharField(max_length=200)
    number_of_slots = models.PositiveIntegerField(default=1)
    duration_of_internship = models.PositiveIntegerField()

    salary = models.ForeignKey(Salary, on_delete=models.SET_NULL, null=True, blank=True, related_name='job_posts')
    application_deadline = models.DateField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()
    active_jobs = ActiveJobManager()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.recruiter.user.email}"

    def clean(self):
        # Prevent past deadlines
        if self.application_deadline and self.application_deadline < timezone.now().date():
            raise ValidationError("Application deadline cannot be in the past.")

    def has_expired(self):
        return self.application_deadline and self.application_deadline < timezone.now().date()


# ------------------ Application Model ------------------

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

    created_at = models.DateTimeField(auto_now_add=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('candidate', 'job_post')
        ordering = ['-applied_at']

    def __str__(self):
        return f"{self.candidate.user.email} → {self.job_post.title} ({self.status})"

    def clean(self):
        if self.status == 'accepted' and not self.resume:
            raise ValidationError("Accepted applications must include a resume.")

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        # Auto-reject pending applications if job slot is filled
        if self.status == 'accepted':
            accepted_count = Application.objects.filter(
                job_post=self.job_post,
                status='accepted'
            ).count()

            if accepted_count >= self.job_post.number_of_slots:
                Application.objects.filter(
                    job_post=self.job_post,
                    status='pending'
                ).exclude(id=self.id).update(status='rejected')
