from rest_framework import serializers
from .models import Candidate
from users.models import User
from django.contrib.auth.password_validation import validate_password
from users.serializers import validate_file_upload
from universities.models import University


class CandidateRegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    skills = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    university = serializers.PrimaryKeyRelatedField(
        queryset=University.objects.all(), 
        required=False,
        allow_null=True
    )


    class Meta:
        model = Candidate
        fields = [
            'username', 'first_name', 'last_name', 'email', 'password', 'confirm_password',
            'professional_title', 'university', 'degree', 'graduation_year',
            'phone', 'city', 'gender', 'languages', 'employment_type',
            'resume', 'profile_picture', 'date_of_birth', 'skills'
        ]
        extra_kwargs = {
            'resume': {'required': False, 'allow_null': True},
            'profile_picture': {'required': False, 'allow_null': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords don't match."})

        resume = attrs.get('resume')
        if resume:
            validate_file_upload(
                resume,
                ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
                max_size=10 * 1024 * 1024  # 10MB
            )

        profile_picture = attrs.get('profile_picture')
        if profile_picture:
            validate_file_upload(
                profile_picture,
                ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                max_size=5 * 1024 * 1024  # 5MB
            )

        return attrs

    def create(self, validated_data):
        user_data = {
            'username': validated_data.pop('username'),
            'email': validated_data.pop('email'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'password': validated_data.pop('password'),
            'role': 'candidate'
        }
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**user_data)
        candidate = Candidate.objects.create(user=user, **validated_data)
        return candidate


class NestedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name']


class CandidateSerializer(serializers.ModelSerializer):
    user = NestedUserSerializer()
    university_name = serializers.CharField(source='university.name', read_only=True)

    class Meta:
        model = Candidate
        fields = [
            'user', 'professional_title', 'university', 'university_name', 'degree',
            'graduation_year', 'phone', 'city', 'gender', 'languages', 'employment_type',
            'resume', 'profile_picture', 'date_of_birth', 'skills'
        ]

    def update(self, instance, validated_data):
   
        user_data = validated_data.pop('user', {})
        for attr, value in user_data.items():
            setattr(instance.user, attr, value)
        instance.user.save()

        # Validate resume if provided
        resume = validated_data.get('resume')
        if resume:
            validate_file_upload(
                resume,
                ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
                max_size=10 * 1024 * 1024
            )

        # Validate profile picture if provided
        profile_picture = validated_data.get('profile_picture')
        if profile_picture:
            validate_file_upload(
                profile_picture,
                ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                max_size=5 * 1024 * 1024
            )

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance
