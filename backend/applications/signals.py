from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from .models import Application
from django.conf import settings

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


@receiver(post_save, sender=Application)
def auto_reject_when_slots_filled(sender, instance, **kwargs):
    if instance.status != 'accepted':
        return 

    job = instance.job_post
    accepted_apps = Application.objects.filter(job_post=job, status='accepted').count()

    if accepted_apps >= job.application_slots:
        
        other_apps = Application.objects.filter(
            job_post=job, status='pending'
        ).exclude(id=instance.id)

        for app in other_apps:
            app.status = 'rejected'
            app.save()

    
            if app.candidate.user.email:
                send_mail(
                    subject="Application Update",
                    message=f"Your application for '{job.title}' has been rejected as all slots have been filled.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[app.candidate.user.email],
                    fail_silently=True
                )

    elif job.is_active is False and accepted_apps < job.application_slots:
        job.is_active = True
        job.save()            
