from rest_framework import serializers
from .models import Candidate
from applications.models import Application
from applications.serializers import JobPostingSerializer


class CandidateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = ['id', 'resume', 'cover_letter']
        read_only_fields = ['id']


class MyApplicationSerializer(serializers.ModelSerializer):
    job_post = JobPostingSerializer(read_only=True)

    class Meta:
        model = Application
        fields = ['id', 'job_post', 'status', 'applied_at']


class ApplicationCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Application
        fields = ['resume', 'cover_letter']


    def _get_candidate(self):
        """Handles both reverse one-to-one and one-to-many related_name"""
        request = self.context.get('request')
        candidate_profile = getattr(request.user, 'candidate_profile', None)
        if candidate_profile and hasattr(candidate_profile, 'first'):
            return candidate_profile.first()
        return candidate_profile

    def validate(self, data):
        candidate = self._get_candidate()
        job_post = self.context.get("job_post")
        print("🔧 Using updated ApplicationCreateSerializer")

        if not candidate or not job_post:
            raise serializers.ValidationError("Applicant and job post must be provided.")

        existing = Application.objects.filter(
            candidate=candidate,
            job_post=job_post
        ).exclude(status__in=["accepted", "rejected"]).first()

        if existing:
            raise serializers.ValidationError("Applicant already applied.")

        return data

    def create(self, validated_data):
        candidate = self._get_candidate()
        job_post = self.context.get("job_post")
        return Application.objects.create(candidate=candidate, job_post=job_post, **validated_data)
