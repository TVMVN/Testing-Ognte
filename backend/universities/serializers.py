from rest_framework import serializers
from .models import University
from users.models import User
from django.contrib.auth.password_validation import validate_password
from users.serializers import validate_file_upload


class UniversityRegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = University
        fields = [
            'username', 'email', 'password', 'confirm_password',
            'name', 'phone', 'website', 'location', 'type', 'courses', 'year', 'description', 'logo'
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
            'password': validated_data.pop('password'),
            'role': 'university'
        }
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**user_data)
        university = University.objects.create(user=user, **validated_data)
        return university


class NestedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email']
        read_only_fields = ['username']  # Username shouldn't be editable


class UniversitySerializer(serializers.ModelSerializer):
    user = NestedUserSerializer()
    email = serializers.EmailField(source='user.email', read_only=True)
    university_id = serializers.IntegerField(source='id', read_only=True)
    candidate_count = serializers.SerializerMethodField()

    class Meta:
        model = University
        fields = [
            'user', 'university_id', 'email', 'name', 'phone', 'website', 'location',
            'type', 'courses', 'year', 'description', 'logo', 'candidate_count'
        ]

    def get_candidate_count(self, obj):
        return obj.candidate_set.count()

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        
        for attr, value in user_data.items():
            if attr != 'username':
                setattr(instance.user, attr, value)
        instance.user.save()

        logo = validated_data.get('logo', None)
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
