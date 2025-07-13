from django.core.mail import send_mail
from django.conf import settings
from .models import Notification
import logging
from users.models import Notification, User

logger = logging.getLogger(__name__)

def create_notification(user, title, message, notification_type='system'):
    """Create a notification for a user"""
    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type
    )

def send_welcome_email(user):
    """Send welcome email to new user"""
    try:
        send_mail(
            'Welcome to Our Platform!',
            f'Hello {user.username},\n\nWelcome to our platform! Your account has been created successfully.',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Failed to send welcome email: {str(e)}")

def notify_admins(title, message, notification_type="system"):
    """
    Sends a system-level notification to all superusers/admins
    """
    admins = User.objects.filter(is_superuser=True)
    for admin in admins:
        Notification.objects.create(
            user=admin,
            title=title,
            message=message,
            notification_type=notification_type
        )

import hashlib

def hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()
