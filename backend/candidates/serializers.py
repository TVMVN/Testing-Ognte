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
        fields = ['resume', 'cover_letter']  # ✅ Exclude 'job_post'
        extra_kwargs = {
            'resume': {'required': True},
            'cover_letter': {'required': False},
            }


    def validate(self, data):
        candidate = self.context.get('candidate')
        job_post = self.context.get('job_post')

        if not candidate or not job_post:
            raise serializers.ValidationError("Candidate and job post are required.")

        existing = Application.objects.filter(
            candidate=candidate,
            job_post=job_post
        ).exclude(status__in=["accepted", "rejected"]).first()

        if existing:
            raise serializers.ValidationError("You have already applied to this job.")

        return data

    def create(self, validated_data):
        candidate = self.context['candidate']
        job_post = self.context['job_post']
        return Application.objects.create(candidate=candidate, job_post=job_post, **validated_data)
