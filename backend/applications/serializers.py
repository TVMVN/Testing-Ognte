from rest_framework import serializers
from .models import JobPost, Application, Salary
from django.core.exceptions import PermissionDenied
from users.models import User
from candidates.models import Candidate
from universities.models import University
from recruiters.models import Recruiter


from .models import Application
from candidates.nested_serializers import CandidateMiniSerializer
from recruiters.nested_serializers import RecruiterMiniSerializer

# ---------------------------
# Salary Serializer
# ---------------------------
class SalarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Salary
        fields = ['amount', 'currency', 'status']


# ---------------------------
# Nested Job Serializer (for display inside applications)
# ---------------------------
class JobNestedSerializer(serializers.ModelSerializer):
    recruiter = serializers.SerializerMethodField()
    salary = SalarySerializer(read_only=True)
    required_skills = serializers.ListField(child=serializers.CharField(), required=False)


    class Meta:
        model = JobPost
        fields = [
            'id', 'title', 'location',  'description',
            'required_skills', 'duration_of_internship',
            'number_of_slots', 'salary', 'recruiter', 'created_at'
        ]

    def get_recruiter(self, obj):
        return str(obj.recruiter.user.get_full_name()) if obj.recruiter else None


# ---------------------------
# Job Serializer (GET)
# ---------------------------
class JobSerializer(serializers.ModelSerializer):
    recruiter = serializers.SerializerMethodField()
    salary = SalarySerializer(read_only=True)
    required_skills = serializers.ListField(child=serializers.CharField(), required=False)


    class Meta:
        model = JobPost
        fields = '__all__'

    def get_recruiter(self, obj):
        return str(obj.recruiter.user.get_full_name()) if obj.recruiter else None


class JobPostingSerializer(serializers.ModelSerializer):
    recruiter = serializers.SerializerMethodField()
    salary = SalarySerializer()
    required_skills = serializers.ListField(child=serializers.CharField(), required=False)


    class Meta:
        model = JobPost
        fields = '__all__'

    def get_recruiter(self, obj):
        recruiter = obj.recruiter
        if recruiter:
            return {
                "company_name": recruiter.company_name,
                "email": recruiter.user.email,
                "phone": recruiter.phone,
            }
        return None

# ---------------------------
# Job Creation Serializer (POST)
# ---------------------------
class JobPostingCreateSerializer(serializers.ModelSerializer):
    salary = SalarySerializer()
    required_skills = serializers.ListField(
        child=serializers.CharField(), required=False
    )

    class Meta:
        model = JobPost
        exclude = ['recruiter', 'created_at', 'updated_at']

    def create(self, validated_data):
        user = self.context['request'].user

        if user.role != 'recruiter' or not hasattr(user, 'recruiter_profile'):
            raise PermissionDenied("Only recruiters can post jobs.")

        validated_data.pop('recruiter', None)

        salary_data = validated_data.pop('salary')
        salary_instance = Salary.objects.create(**salary_data)
        recruiter = user.recruiter_profile
        job_post = JobPost.objects.create(
            recruiter=recruiter,
            salary=salary_instance,
            **validated_data
        )

        return job_post
    
    def update(self, instance, validated_data):
        salary_data = validated_data.pop('salary', None)

        # Update salary fields if provided
        if salary_data:
            salary = instance.salary
            for attr, value in salary_data.items():
                setattr(salary, attr, value)
            salary.save()

        # Update job post fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


# ---------------------------
# Application Serializer (GET)
# ---------------------------

class ApplicationSerializer(serializers.ModelSerializer):
    candidate = CandidateMiniSerializer()
    job_post = JobNestedSerializer()
    recruiter = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id', 'candidate', 'job_post', 'recruiter',
            'resume', 'cover_letter', 'applied_at',
            'status', 'duration_of_internship'
        ]

    def get_recruiter(self, obj):
        if hasattr(obj.job_post, 'recruiter'):
            return RecruiterMiniSerializer(obj.job_post.recruiter).data
        return None

class ApplicationFlatSerializer(serializers.ModelSerializer):
    # Candidate fields (flattened)
    candidate_first_name = serializers.CharField(source='candidate.user.first_name')
    candidate_last_name = serializers.CharField(source='candidate.user.last_name')
    candidate_university_name = serializers.CharField(source='candidate.university.name')
    # Add more candidate fields here if needed, e.g., professional_title, skills

    # Job post fields (flattened)
    job_post_title = serializers.CharField(source='job_post.title')
    job_post_location = serializers.CharField(source='job_post.location')
    job_post_industry = serializers.SerializerMethodField()

    # Recruiter fields (flattened)
    recruiter_name = serializers.SerializerMethodField()
    recruiter_industry = serializers.SerializerMethodField()

    # Other application fields
    resume = serializers.CharField()
    cover_letter = serializers.CharField()
    applied_at = serializers.DateTimeField()
    status = serializers.CharField()
    duration_of_internship = serializers.IntegerField()

    class Meta:
        model = Application
        fields = [
            'id',
            'candidate_first_name',
            'candidate_last_name',
            'candidate_university_name',
            'job_post_title',
            'job_post_location',
            'job_post_industry',
            'recruiter_name',
            'recruiter_industry',
            'resume',
            'cover_letter',
            'applied_at',
            'status',
            'duration_of_internship',
        ]

    def get_job_post_industry(self, obj):
        # Defensive fallback if industry is missing
        return getattr(obj.job_post, 'industry', '') or ''

    def get_recruiter_name(self, obj):
        recruiter = getattr(obj.job_post, 'recruiter', None)
        return recruiter.name if recruiter and hasattr(recruiter, 'name') else ''

    def get_recruiter_industry(self, obj):
        recruiter = getattr(obj.job_post, 'recruiter', None)
        return recruiter.industry if recruiter and hasattr(recruiter, 'industry') else ''

# ---------------------------
# Application Creation Serializer (POST)
# ---------------------------
class ApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        exclude = ['candidate', 'applied_at', 'status']

    def create(self, validated_data):
        user = self.context['request'].user

        if user.role != 'candidate' or not hasattr(user, 'candidate_profile'):
            raise PermissionDenied("Only candidates can apply for jobs.")

        candidate = user.candidate_profile
        return Application.objects.create(candidate=candidate, **validated_data)
