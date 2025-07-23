from rest_framework import serializers
from applications.models import JobPost

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