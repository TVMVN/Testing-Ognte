from rest_framework import serializers
from .models import Recruiter

class RecruiterMiniSerializer(serializers.ModelSerializer):
    industry = serializers.CharField()

    class Meta:
        model = Recruiter
        fields = ['id', 'industry']
