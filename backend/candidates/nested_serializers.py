from rest_framework import serializers
from .models import Candidate

class CandidateMiniSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email')
    university_name = serializers.CharField(source='university.name', read_only=True)

    class Meta:
        model = Candidate
        fields = ['id', 'first_name', 'last_name', 'email', 'university_name']
