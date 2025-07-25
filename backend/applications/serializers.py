from rest_framework import serializers
from .models import JobPost, Application, Salary
from django.core.exceptions import PermissionDenied


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
    candidate = serializers.SerializerMethodField()
    job_post = JobNestedSerializer()

    class Meta:
        model = Application
        fields = [
            'id', 'candidate', 'job_post',
            'resume', 'cover_letter',
            'applied_at', 'status'
        ]
    
    def get_candidate(self, obj):
        return str(obj.candidate.user.get_full_name()) if obj.candidate else None


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
