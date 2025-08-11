from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from .models import Application
from django.conf import settings

from django.core.mail import EmailMultiAlternatives
from django.utils.html import format_html
from .models import Application

@receiver(post_save, sender=Application)
def notify_recruiter_on_application(sender, instance, created, **kwargs):
    if created:
        recruiter_email = instance.job_post.recruiter.user.email
        candidate_name = instance.candidate.user.get_full_name() or instance.candidate.user.username
        job_title = instance.job_post.title
        candidate_email = instance.candidate.user.email

        # Plain text fallback
        text_content = f"{candidate_name} ({candidate_email}) applied for {job_title}."

        # HTML version
        html_content = format_html("""
            <html>
                <body style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #007BFF;">New Job Application Received</h2>
                    <p>
                        <strong>{}</strong> (<a href="mailto:{}">{}</a>) has applied for 
                        the position: <strong>{}</strong>.
                    </p>
                    <p style="margin-top: 20px;">
                        Please <a href="https://yourdomain.com/recruiter/applications/{}/" 
                        style="color: white; background-color: #007BFF; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
                        View Application
                        </a>
                    </p>
                    <hr>
                    <p style="font-size: 12px; color: #888;">
                        This is an automated message. Do not reply directly to this email.
                    </p>
                </body>
            </html>
        """, candidate_name, candidate_email, candidate_email, job_title, instance.id)

        msg = EmailMultiAlternatives(
            subject="New Job Application Received",
            body=text_content,
            from_email="noreply@example.com",
            to=[recruiter_email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=True)


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
