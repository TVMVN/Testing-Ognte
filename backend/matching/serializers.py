from rest_framework import serializers
from .models import CandidateJobMatch
from candidates.serializers import CandidateProfileSerializer
from applications.serializers import JobPostingCreateSerializer

class CandidateJobMatchSerializer(serializers.ModelSerializer):
    candidate = CandidateProfileSerializer(read_only=True)
    job_post = JobPostingCreateSerializer(read_only=True)

    class Meta:
        model = CandidateJobMatch
        fields = '__all__'
