from rest_framework import serializers
from django.utils.timezone import now
from datetime import timedelta
from django.contrib.auth import get_user_model
from .models import Salary, JobPost, Application
from recruiters.models import Recruiter
from candidates.models import Candidate

User = get_user_model()

class SalarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Salary
        fields = ['amount', 'currency', 'status', 'payment_frequency']

class JobSerializer(serializers.ModelSerializer):
    applications = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    salary = SalarySerializer()

    class Meta:
        model = JobPost
        fields = [
            'id', 'title', 'description', 'created_at', 'application_deadline',
            'is_active', 'is_expired', 'applications', 'location', 'skills', 'salary'
        ]

    def get_is_expired(self, obj):
        return obj.has_expired()

    def get_applications(self, obj):
        one_week_ago = now() - timedelta(days=7)
        recent_apps = obj.applications.filter(applied_at__gte=one_week_ago)
        return [
            {
                "applicant": app.candidate.user.get_full_name() or app.candidate.user.username,
                "applied_at": app.applied_at.isoformat(),
                "status": app.status,
            }
            for app in recent_apps
        ]

    def create(self, validated_data):
        salary_data = validated_data.pop('salary')
        salary = Salary.objects.create(**salary_data)
        job_post = JobPost.objects.create(salary=salary, **validated_data)
        return job_post

    def update(self, instance, validated_data):
        salary_data = validated_data.pop('salary', None)
        if salary_data:
            if instance.salary:
                for attr, value in salary_data.items():
                    setattr(instance.salary, attr, value)
                instance.salary.save()
            else:
                salary = Salary.objects.create(**salary_data)
                instance.salary = salary

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class JobNestedSerializer(serializers.ModelSerializer):
    salary = SalarySerializer()

    class Meta:
        model = JobPost
        fields = ['id', 'title', 'description', 'created_at', 'location', 'skills', 'salary']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class RecruiterSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Recruiter
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

class JobPostingSerializer(serializers.ModelSerializer):
    recruiter = RecruiterSerializer(read_only=True)
    applications_count = serializers.SerializerMethodField()

    class Meta:
        model = JobPost
        fields = '__all__'
        read_only_fields = ['recruiter', 'created_at', 'updated_at']

    def get_applications_count(self, obj):
        return obj.applications.count()

class JobPostingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPost
        exclude = ['recruiter', 'created_at', 'updated_at']

class CandidateSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Candidate
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

class ApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['resume', 'cover_letter']  # add other fields if needed

    def validate(self, data):
        candidate = self.context.get("candidate")
        job_post = self.context.get("job_post")

        if not candidate or not job_post:
            raise serializers.ValidationError("Applicant and job post must be provided.")

        # Check for duplicate
        existing = Application.objects.filter(
            candidate=candidate,
            job_post=job_post
        ).exclude(status__in=["accepted", "rejected"]).first()

        if existing:
            raise serializers.ValidationError("Applicant already applied to this job.")

        return data


    def create(self, validated_data):
        request = self.context.get('request')
        candidate = self.context.get("candidate")
        job_post = self.context.get('job_post')
        
        # Safely inject both
        validated_data['candidate'] = candidate
        validated_data['job_post'] = job_post

        return Application.objects.create(**validated_data)



class ApplicationDetailSerializer(serializers.ModelSerializer):
    candidate = CandidateSerializer(read_only=True)
    job_post = JobNestedSerializer(read_only=True)

    class Meta:
        model = Application
        fields = ['id', 'job_post', 'candidate', 'applied_at', 'status']

class ApplicationStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['status']

class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['id', 'candidate', 'job_post', 'resume', 'cover_letter', 'applied_at']
        read_only_fields = ['candidate', 'applied_at']
