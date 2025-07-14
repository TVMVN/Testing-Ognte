from datetime import date
from django.db.models import Q
from applications.models import JobPost


def auto_expire_jobs():
    """
    Deactivates all JobPosts whose application deadline has passed
    and are still marked as active.
    
    Returns the number of jobs that were updated.
    """
    today = date.today()
    
    # Find jobs that should expire
    expired_jobs = JobPost.objects.filter(
        Q(is_active=True),
        Q(application_deadline__lt=today)
    )

    # Update them
    updated_count = expired_jobs.update(is_active=False)

    return updated_count
