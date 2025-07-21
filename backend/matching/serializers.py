from rest_framework import serializers
from .models import CandidateJobMatch
from candidates.serializers import CandidateSerializer
from jobs.serializers import JobPostSerializer

class CandidateJobMatchSerializer(serializers.ModelSerializer):
    candidate = CandidateSerializer(read_only=True)
    job_post = JobPostSerializer(read_only=True)

    class Meta:
        model = CandidateJobMatch
        fields = '__all__'
