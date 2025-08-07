from rest_framework import serializers
from .models import Candidate
from applications.models import Application
from applications.serializers import JobPostingSerializer


class CandidateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = ['id', 'resume', 'cover_letter', 'skills', 'resume_score']
        read_only_fields = ['id', 'skills', 'resume_score']


class MyApplicationSerializer(serializers.ModelSerializer):
    job_post = JobPostingSerializer(read_only=True)

    class Meta:
        model = Application
        fields = ['id', 'job_post', 'status', 'applied_at']


class ApplicationCreateSerializer(serializers.ModelSerializer):
    cover_letter = serializers.CharField(required=False, allow_blank=True)
    class Meta:
        model = Application
        fields = ['resume', 'cover_letter', 'duration_of_internship', 'additional_skills']


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
        from .resume_parser import ResumeParser
        import os
        candidate = self._get_candidate()
        job_post = self.context.get("job_post")
        application = Application.objects.create(candidate=candidate, job_post=job_post, **validated_data)

        # Analyze resume if uploaded
        resume_file = validated_data.get('resume')
        if resume_file:
            # Save file temporarily if needed
            file_path = resume_file.path if hasattr(resume_file, 'path') else None
            if not file_path:
                # If InMemoryUploadedFile, save to temp
                from django.core.files.temp import NamedTemporaryFile
                temp_file = NamedTemporaryFile(delete=False, suffix=os.path.splitext(resume_file.name)[-1])
                for chunk in resume_file.chunks():
                    temp_file.write(chunk)
                temp_file.close()
                file_path = temp_file.name
            parser = ResumeParser()
            try:
                result = parser.analyze_resume(file_path)
                candidate.skills = result.get('skills', [])
                candidate.resume_score = result.get('score', 0)
                candidate.save()
            except Exception as e:
                # Optionally log error
                pass
            finally:
                # Clean up temp file if created
                if 'temp_file' in locals():
                    os.unlink(temp_file.name)

        return application
