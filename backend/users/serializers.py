from rest_framework import serializers
from users.models import User, Notification
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.password_validation import validate_password
from django.core.files.uploadedfile import InMemoryUploadedFile
import filetype
import mimetypes

def detect_file_type(file):
    """
    Detect file type using filetype library with fallback to mimetypes
    """
    try:
        # Reset file pointer to beginning
        file.seek(0)
        
        # Read first 261 bytes for filetype detection
        header = file.read(261)
        file.seek(0)  # Reset file pointer
        
        # Use filetype library to detect by file signature
        kind = filetype.guess(header)
        if kind is not None:
            return kind.mime
        
        # Fallback to mimetypes if filetype fails
        if hasattr(file, 'name') and file.name:
            mime_type, _ = mimetypes.guess_type(file.name)
            if mime_type:
                return mime_type
        
        # Default fallback
        return 'application/octet-stream'
        
    except Exception as e:
        # If all else fails, try mimetypes as last resort
        if hasattr(file, 'name') and file.name:
            mime_type, _ = mimetypes.guess_type(file.name)
            return mime_type or 'application/octet-stream'
        return 'application/octet-stream'

def validate_file_type(file, allowed_types=None):
    """
    Validate file type against allowed types
    """
    if allowed_types is None:
        # Default allowed types
        allowed_types = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain', 'text/csv',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/msword', 'application/vnd.ms-excel'
        ]
    
    detected_type = detect_file_type(file)
    
    if detected_type not in allowed_types:
        raise serializers.ValidationError(
            f"File type '{detected_type}' is not allowed. "
            f"Allowed types: {', '.join(allowed_types)}"
        )
    
    return detected_type

def validate_file_upload(file, allowed_types=None, max_size=None):

    if max_size is None:
        max_size = 10 * 1024 * 1024  # 10MB default
    
    # Check file size

    if file.size > max_size:
        raise serializers.ValidationError(
            f"File size must be less than {max_size // (1024*1024)}MB"
        )
    
    # Check file type
    detected_type = validate_file_type(file, allowed_types)
    
    return {
        'file': file,
        'detected_type': detected_type,
        'file_size': file.size
    }

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Check if account is locked
        if self.user.is_account_locked():
            raise serializers.ValidationError("Account is temporarily locked due to failed login attempts.")
        
        # Reset failed attempts on successful login
        if self.user.failed_login_attempts > 0:
            self.user.failed_login_attempts = 0
            self.user.account_locked_until = None
            self.user.save()
        
        data['role'] = self.user.role
        data['username'] = self.user.username
        data['user_id'] = self.user.id
        data['email'] = self.user.email
        data['theme'] = self.user.theme
        data['is_email_verified'] = self.user.is_email_verified
        return data
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        token['theme'] = user.theme
        return token

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'theme', 'date_joined',
                  'is_active', 'is_email_verified', 'password']
        read_only_fields = ['id', 'role', 'date_joined', 'is_email_verified']
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def validate_email(self, value):
        user = self.instance
        if user and User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

class ThemePreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['theme']

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("New passwords don't match.")
        return attrs

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']

# Example file upload serializer with file type validation
class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    allowed_types = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="List of allowed MIME types"
    )
    
    def validate_file(self, value):
        # Get allowed types from validated data or use defaults
        allowed_types = self.initial_data.get('allowed_types', None)
        
        # Use the validate_file_upload function
        validation_result = validate_file_upload(value, allowed_types)
        
        return validation_result['file']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if 'file' in data and data['file']:
            # Add detected file type to response
            data['detected_type'] = detect_file_type(instance['file'])
        return data

# Profile picture upload serializer
class ProfilePictureSerializer(serializers.Serializer):
    profile_picture = serializers.ImageField()
    
    def validate_profile_picture(self, value):
        # Only allow image files for profile pictures
        allowed_image_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        max_size = 5 * 1024 * 1024  # 5MB
        
        # Use the validate_file_upload function
        validation_result = validate_file_upload(value, allowed_image_types, max_size)
        
        return validation_result['file']

# Document upload serializer
class DocumentUploadSerializer(serializers.Serializer):
    document = serializers.FileField()
    document_type = serializers.CharField(max_length=50, required=False)
    
    def validate_document(self, value):
        # Allow common document types
        allowed_doc_types = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
        ]
        max_size = 20 * 1024 * 1024  # 20MB
        
        # Use the validate_file_upload function
        validation_result = validate_file_upload(value, allowed_doc_types, max_size)
        
        return validation_result['file']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if 'document' in data and data['document']:
            data['detected_type'] = detect_file_type(instance['document'])
            data['file_size'] = instance['document'].size
        return data

# Resume upload serializer (commonly used in recruitment systems)
class ResumeUploadSerializer(serializers.Serializer):
    resume = serializers.FileField()
    
    def validate_resume(self, value):
        # Common resume file types
        allowed_resume_types = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ]
        max_size = 10 * 1024 * 1024  # 10MB
        
        # Use the validate_file_upload function
        validation_result = validate_file_upload(value, allowed_resume_types, max_size)
        
        return validation_result['file']
    



from rest_framework import serializers

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

class ResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return attrs


from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return attrs

class DeleteAccountSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)
    confirm_deletion = serializers.BooleanField()

    def validate(self, attrs):
        if not attrs.get("confirm_deletion", False):
            raise serializers.ValidationError("You must confirm account deletion.")
        return attrs