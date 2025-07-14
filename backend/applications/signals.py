from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from .models import Application

@receiver(post_save, sender=Application)
def notify_recruiter_on_application(sender, instance, created, **kwargs):
    if created:
        recruiter_email = instance.job_post.recruiter.user.email
        send_mail(
            subject="New Job Application Received",
            message=f"{instance.candidate.user.email} applied for {instance.job_post.title}.",
            from_email="noreply@example.com",
            recipient_list=[recruiter_email],
            fail_silently=True,
        )
