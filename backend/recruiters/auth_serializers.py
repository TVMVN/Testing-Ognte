from rest_framework import serializers
from .models import Recruiter
from users.models import User
from django.contrib.auth.password_validation import validate_password
from users.serializers import validate_file_upload


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name']
        read_only_fields = ['username']


class RecruiterRegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = Recruiter
        fields = [
            'username', 'first_name', 'last_name', 'email', 'password', 'confirm_password',
            'company_name', 'phone', 'website', 'company_size', 'location',
            'industry', 'bio', 'logo'
        ]
        extra_kwargs = {
        'logo': {'required': False, 'allow_null': True}
    }

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords don't match."})

        logo = attrs.get('logo', None)
        if logo:
            validate_file_upload(
                logo,
                ['image/jpeg', 'image/png', 'image/gif'],
                max_size=5 * 1024 * 1024
            )

        return attrs

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def create(self, validated_data):
        user_data = {
            'username': validated_data.pop('username'),
            'email': validated_data.pop('email'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'password': validated_data.pop('password'),
            'role': 'recruiter'
        }
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**user_data)
        recruiter = Recruiter.objects.create(user=user, **validated_data)
        return recruiter


class RecruiterSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Recruiter
        fields = [
            'user', 'company_name',   'phone', 'website', 
            'company_size', 'location', 'industry', 'bio', 'logo'
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)

        if user_data:
            for attr, value in user_data.items():
                if attr != 'username':
                    setattr(instance.user, attr, value)
            instance.user.save()

        logo = validated_data.get('logo')
        if logo:
            validate_file_upload(
                logo,
                ['image/jpeg', 'image/png', 'image/gif'],
                max_size=5 * 1024 * 1024
            )

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance

