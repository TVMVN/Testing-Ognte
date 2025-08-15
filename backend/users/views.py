from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from django.core.paginator import Paginator
from rest_framework_simplejwt.tokens import RefreshToken
from candidates.auth_serializers import CandidateRegisterSerializer
from recruiters.auth_serializers import RecruiterRegisterSerializer
from universities.serializers import UniversityRegisterSerializer
from .serializers import *
from .models import User, Notification
from .utils import create_notification, send_welcome_email


from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import DeleteAccountSerializer
from users.models import User
from users.utils import create_notification
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.conf import settings
from django.utils import timezone
from django.core.mail import send_mail

from .serializers import ForgotPasswordSerializer
from .models import User
from .utils import create_notification, hash_token
import logging


logger = logging.getLogger(__name__)


class CandidateRegisterView(generics.CreateAPIView):
    serializer_class = CandidateRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                response = super().create(request, *args, **kwargs)
                if response.status_code == status.HTTP_201_CREATED:
                    user = User.objects.get(email=request.data.get('email'))
                    create_notification(
                        user, 
                        'Welcome to Our Platform!', 
                        'Your candidate account has been created successfully.',
                        'welcome'
                    )
                    send_welcome_email(user)
                return response
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return Response(
                {'error': 'Registration failed. Please try again.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class RecruiterRegisterView(generics.CreateAPIView):
    serializer_class = RecruiterRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                response = super().create(request, *args, **kwargs)
                if response.status_code == status.HTTP_201_CREATED:
                    user = User.objects.get(email=request.data.get('email'))
                    create_notification(
                        user, 
                        'Welcome Recruiter!', 
                        'Your recruiter account has been created successfully.',
                        'welcome'
                    )
                    send_welcome_email(user)
                return response
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return Response(
                {'error': 'Registration failed. Please try again.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class UniversityRegisterView(generics.CreateAPIView):
    serializer_class = UniversityRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                response = super().create(request, *args, **kwargs)
                if response.status_code == status.HTTP_201_CREATED:
                    user = User.objects.get(email=request.data.get('email'))
                    create_notification(
                        user, 
                        'Welcome University!', 
                        'Your university account has been created successfully.',
                        'welcome'
                    )
                    send_welcome_email(user)
                return response
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return Response(
                {'error': 'Registration failed. Please try again.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            create_notification(
                request.user,
                'Logout Successful',
                'You have been logged out successfully.',
                'login'
            )
            
            return Response(
                {"message": "Successfully logged out"}, 
                status=status.HTTP_205_RESET_CONTENT
            )
        except Exception as e:
            return Response(
                {"error": "Invalid token"}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id, 
                user=request.user
            )
            notification.is_read = True
            notification.save()
            return Response({"message": "Notification marked as read"})
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )


class NotificationMarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked as read"})


class UserThemePreferenceView(generics.RetrieveUpdateAPIView):
    serializer_class = ThemePreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        create_notification(
            request.user,
            'Theme Updated',
            f'Your theme has been changed to {request.data.get("theme")}.',
            'profile_update'
        )
        return response






class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email, is_active=True)

                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token_hash = hash_token(token)

                user.password_reset_token = token_hash
                user.password_reset_token_created = timezone.now()
                user.save()

                reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
                self.send_password_reset_email(user, reset_url)

                create_notification(
                    user, 'Password Reset Request',
                    'A password reset link has been sent to your email.',
                    'password_change'
                )

                logger.info(f"Password reset email sent to {email}")

            except User.DoesNotExist:
                logger.warning(f"Password reset attempt for non-existent email: {email}")

            return Response({
                "message": "If an account with this email exists, a password reset link has been sent."
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def send_password_reset_email(self, user, reset_url):
        subject = 'Reset Your Password'
        html_message = f"""
        <html><body>
        <h2>Password Reset Request</h2>
        <p>Hello {user.username},</p>
        <p>Click below to reset your password:</p>
        <p><a href="{reset_url}">Reset Password</a></p>
        <p>This link expires in 1 hour.</p>
        </body></html>
        """
        plain_message = f"Hello {user.username},\n\nClick to reset your password:\n{reset_url}\n\nThis link expires in 1 hour."
        send_mail(subject, plain_message, settings.DEFAULT_FROM_EMAIL, [user.email], html_message=html_message)


from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str

class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, uidb64, token):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            try:
                uid = force_str(urlsafe_base64_decode(uidb64))
                user = User.objects.get(pk=uid)

                if not default_token_generator.check_token(user, token):
                    return Response({"error": "Invalid or expired reset link."}, status=status.HTTP_400_BAD_REQUEST)

                if user.password_reset_token != hash_token(token):
                    return Response({"error": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST)

                if user.password_reset_token_created:
                    age = (timezone.now() - user.password_reset_token_created).total_seconds()
                    if age > 3600:
                        return Response({"error": "Reset link has expired."}, status=status.HTTP_400_BAD_REQUEST)

                user.set_password(serializer.validated_data['new_password'])
                user.password_reset_token = None
                user.password_reset_token_created = None
                user.failed_login_attempts = 0
                user.account_locked_until = None
                user.save()

                create_notification(user, 'Password Reset Successful', 'Your password has been reset.', 'password_change')
                logger.info(f"Password reset successful for {user.email}")
                return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)

            except (User.DoesNotExist, ValueError, TypeError):
                return Response({"error": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user

            if not user.check_password(serializer.validated_data['old_password']):
                return Response({"error": "Old password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(serializer.validated_data['new_password'])
            user.save()

            create_notification(user, 'Password Changed', 'Your password was changed successfully.', 'password_change')
            logger.info(f"Password changed for user: {user.email}")
            return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class DeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DeleteAccountSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user

            if not user.check_password(serializer.validated_data['password']):
                return Response({"error": "Password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

            if not serializer.validated_data.get('confirm_deletion', False):
                return Response({"error": "Please confirm account deletion."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                with transaction.atomic():
                    email = user.email
                    username = user.username

                    self.send_account_deletion_email(user)

                    # Blacklist refresh token (optional)
                    refresh_token = request.data.get("refresh_token")
                    if refresh_token:
                        try:
                            token = RefreshToken(refresh_token)
                            token.blacklist()
                        except Exception as e:
                            logger.warning(f"Token blacklist failed for {user.email}: {str(e)}")

                    user.delete()

                    logger.info(f"Account deleted for user: {email}")
                    return Response({"message": "Account has been deleted successfully."}, status=status.HTTP_200_OK)

            except Exception as e:
                logger.error(f"Account deletion failed for {user.email}: {str(e)}")
                return Response({"error": "Account deletion failed. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def send_account_deletion_email(self, user):
        subject = 'Account Deletion Confirmation'

        html_message = f"""
        <html><body>
            <h2>Account Deletion Confirmation</h2>
            <p>Hello {user.username},</p>
            <p>Your account has been successfully deleted from our platform.</p>
            <p>If you did not request this, please contact our support team immediately.</p>
            <p>Best regards,<br>OGnite Management Team</p>
        </body></html>
        """

        plain_message = f"""
        Hello {user.username},

        Your account has been successfully deleted from our platform.

        If you did not request this, please contact our support team immediately.

        Best regards,
        OGnite Management Team
        """

        try:
            send_mail(
                subject,
                plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                html_message=html_message,
                fail_silently=True,
            )
        except Exception as e:
            logger.error(f"Failed to send account deletion email to {user.email}: {str(e)}")
