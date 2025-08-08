from rest_framework import serializers
from applications.models import JobPost

from rest_framework import serializers
from applications.models import Application

from rest_framework import serializers
from applications.models import Application


class AcceptedCandidateSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='candidate.user.get_full_name')
    candidate_email = serializers.CharField(source='candidate.user.email')
    professional_title = serializers.CharField(source='candidate.professional_title')
    duration_of_internship = serializers.IntegerField()
    skills = serializers.ListField(source='candidate.skills')
    additional_skills = serializers.ListField()
    languages = serializers.SerializerMethodField()
    resume_url = serializers.SerializerMethodField()
    cover_letter_url = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()
    job_title = serializers.CharField(source='job_post.title')

    class Meta:
        model = Application
        fields = [
            'id',
            'job_title',
            'candidate_name',
            'candidate_email',
            'professional_title',
            'duration_of_internship',
            'skills',
            'additional_skills',
            'languages',
            'resume_url',
            'cover_letter_url',
            'profile_picture_url',
            'applied_at',
        ]

    def get_resume_url(self, obj):
        request = self.context.get('request')
        if obj.candidate.resume:
            return request.build_absolute_uri(obj.candidate.resume.url)
        return None

    def get_cover_letter_url(self, obj):
        request = self.context.get('request')
        if obj.candidate.cover_letter:
            return request.build_absolute_uri(obj.candidate.cover_letter.url)
        return None

    def get_profile_picture_url(self, obj):
        request = self.context.get('request')
        if obj.candidate.profile_picture:
            return request.build_absolute_uri(obj.candidate.profile_picture.url)
        return None
    
    def get_languages(self, obj):
        langs = obj.candidate.languages
        if isinstance(langs, str):
            return [lang.strip() for lang in langs.split(',')]
        return langs


class JobPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPost
        fields = ['id', 'title', 'description', 'location', 'required_skills', 'recruiter']
        read_only_fields = ['recruiter']

# class MentorApplicationSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = MentorApplication
#         fields = ['id', 'mentor', 'application', 'status', 'applied_at']
#         read_only_fields = ['mentor', 'status', 'applied_at']