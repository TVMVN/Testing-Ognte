from rest_framework import serializers
from .models import Candidate
from applications.models import Application
from applications.serializers import JobPostingSerializer
import logging

# Set up logger
logger = logging.getLogger(__name__)

class CandidateProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)



    class Meta:
        model = Candidate
        fields = [ 
            'id',
            'first_name',
            'last_name',
            'email',
            'resume',
            'cover_letter',
            'skills',
            'resume_score',
            'professional_title',
            'university'
        ]
        read_only_fields = ['id', 'skills', 'resume_score']


class MyApplicationSerializer(serializers.ModelSerializer):
    job_post = JobPostingSerializer(read_only=True)
    candidate_profile = CandidateProfileSerializer(read_only=True)


    class Meta:
        model = Application
        fields = ['id', 'candidate_profile', 'job_post', 'status', 'applied_at']


class ApplicationCreateSerializer(serializers.ModelSerializer):
    # Add additional_skills as a JSONField to handle the frontend data
    additional_skills = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model = Application
        fields = ['resume', 'cover_letter', 'duration_of_internship', 'additional_skills']

    def _get_candidate(self):
        """Handles both reverse one-to-one and one-to-many related_name"""
        try:
            request = self.context.get('request')
            logger.info(f"🔍 Request user: {request.user if request else 'No request'}")
            
            if not request or not request.user:
                logger.error("❌ No request or user in context")
                return None
                
            if not hasattr(request.user, 'candidate_profile'):
                logger.error(f"❌ User {request.user.username} has no candidate_profile attribute")
                return None
                
            candidate_profile = getattr(request.user, 'candidate_profile', None)
            logger.info(f"🔍 Candidate profile type: {type(candidate_profile)}")
            
            # Handle different relationship types
            if candidate_profile and hasattr(candidate_profile, 'first'):
                # This is a QuerySet (one-to-many or many-to-many)
                candidate = candidate_profile.first()
                logger.info(f"🔍 Got candidate from QuerySet: {candidate}")
                return candidate
            else:
                # This is a direct object (one-to-one)
                logger.info(f"🔍 Got candidate directly: {candidate_profile}")
                return candidate_profile
                
        except Exception as e:
            logger.error(f"❌ Error getting candidate: {str(e)}")
            return None

    def validate(self, data):
        logger.info("🚀 Starting validation")
        logger.info(f"🔍 Received data: {data}")
        
        # Log all context data
        context = self.context
        logger.info(f"🔍 Context keys: {list(context.keys())}")
        
        candidate = self._get_candidate()
        job_post = context.get("job_post")
        
        logger.info(f"🔍 Candidate: {candidate}")
        logger.info(f"🔍 Job post: {job_post}")
        
        if not candidate:
            error_msg = "Candidate profile not found. Please ensure you have a complete profile."
            logger.error(f"❌ {error_msg}")
            raise serializers.ValidationError({"candidate": error_msg})

        if not job_post:
            error_msg = "Job post not found in context."
            logger.error(f"❌ {error_msg}")
            raise serializers.ValidationError({"job_post": error_msg})

        # Check for existing applications
        try:
            existing = Application.objects.filter(
                candidate=candidate,
                job_post=job_post
            ).exclude(status__in=["accepted", "rejected"]).first()
            
            if existing:
                error_msg = f"You have already applied for this position (Application ID: {existing.id})."
                logger.error(f"❌ {error_msg}")
                raise serializers.ValidationError({"application": error_msg})
                
        except Exception as e:
            logger.error(f"❌ Error checking existing applications: {str(e)}")
            raise serializers.ValidationError({"database": f"Database error: {str(e)}"})

        # Validate duration_of_internship
        duration = data.get('duration_of_internship')
        if not duration:
            error_msg = "Duration of internship is required."
            logger.error(f"❌ {error_msg}")
            raise serializers.ValidationError({"duration_of_internship": error_msg})
            
        # Convert duration to integer if it's a string
        try:
            duration_int = int(duration)
            if duration_int <= 0:
                raise ValueError("Duration must be positive")
            data['duration_of_internship'] = duration_int
            logger.info(f"✅ Duration validated: {duration_int} months")
        except (ValueError, TypeError) as e:
            error_msg = f"Duration must be a positive number. Received: {duration}"
            logger.error(f"❌ {error_msg}")
            raise serializers.ValidationError({"duration_of_internship": error_msg})

        # Handle resume validation for different apply methods
        resume = data.get('resume')
        if resume:
            logger.info(f"✅ Custom resume provided: {resume.name}")
            # This is manual apply - resume provided
        else:
            # This might be auto apply - check if candidate has resume in profile
            if not candidate.resume:
                error_msg = "No resume provided and no resume found in profile. Please upload a resume or use manual apply."
                logger.error(f"❌ {error_msg}")
                raise serializers.ValidationError({"resume": error_msg})
            logger.info(f"✅ Using profile resume: {candidate.resume}")

        # Validate additional_skills if provided
        additional_skills = data.get('additional_skills')
        if additional_skills:
            if not isinstance(additional_skills, list):
                error_msg = "Additional skills must be a list."
                logger.error(f"❌ {error_msg}")
                raise serializers.ValidationError({"additional_skills": error_msg})
            logger.info(f"✅ Additional skills: {additional_skills}")

        # Validate cover letter if provided
        cover_letter = data.get('cover_letter')
        if cover_letter:
            logger.info(f"✅ Cover letter provided: {cover_letter.name if hasattr(cover_letter, 'name') else 'text content'}")

        logger.info("✅ Validation completed successfully")
        return data

    def create(self, validated_data):
        logger.info("🚀 Starting application creation")
        logger.info(f"🔍 Validated data: {validated_data}")
        
        try:
            from .resume_parser import ResumeParser
            import os
            
            candidate = self._get_candidate()
            job_post = self.context.get("job_post")
            
            if not candidate or not job_post:
                error_msg = "Missing candidate or job_post during creation"
                logger.error(f"❌ {error_msg}")
                raise serializers.ValidationError(error_msg)

            # Extract additional_skills before creating application
            additional_skills = validated_data.pop('additional_skills', None)
            
            # Create the application
            application = Application.objects.create(
                candidate=candidate, 
                job_post=job_post, 
                **validated_data
            )
            logger.info(f"✅ Application created with ID: {application.id}")

            # Handle additional skills
            if additional_skills:
                # Merge with existing candidate skills
                existing_skills = list(candidate.skills) if candidate.skills else []
                all_skills = list(set(existing_skills + additional_skills))  # Remove duplicates
                candidate.skills = all_skills
                logger.info(f"✅ Updated candidate skills: {all_skills}")

            # Analyze resume if uploaded (manual apply)
            resume_file = validated_data.get('resume')
            if resume_file:
                logger.info(f"🔍 Analyzing uploaded resume: {resume_file.name}")
                self._analyze_resume(resume_file, candidate)
            else:
                # For auto apply, use existing profile resume
                if candidate.resume:
                    logger.info(f"🔍 Using existing profile resume for auto apply")
                    # Optionally re-analyze profile resume
                    # self._analyze_resume(candidate.resume, candidate)
                
            candidate.save()
            logger.info("✅ Application creation completed successfully")
            return application
            
        except Exception as e:
            logger.error(f"❌ Error creating application: {str(e)}")
            logger.error(f"❌ Error type: {type(e)}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            raise serializers.ValidationError(f"Failed to create application: {str(e)}")

    def _analyze_resume(self, resume_file, candidate):
        """Helper method to analyze resume and update candidate skills"""
        try:
            from .resume_parser import ResumeParser
            import os
            from tempfile import NamedTemporaryFile
            
            # Save file temporarily if needed
            file_path = resume_file.path if hasattr(resume_file, 'path') else None
            temp_file_created = False
            
            if not file_path:
                # If InMemoryUploadedFile, save to temp
                temp_file = NamedTemporaryFile(delete=False, suffix=os.path.splitext(resume_file.name)[-1])
                for chunk in resume_file.chunks():
                    temp_file.write(chunk)
                temp_file.close()
                file_path = temp_file.name
                temp_file_created = True
                
            parser = ResumeParser()
            result = parser.analyze_resume(file_path)
            
            # Update candidate profile
            parsed_skills = result.get('skills', [])
            if parsed_skills:
                # Merge with existing skills
                existing_skills = list(candidate.skills) if candidate.skills else []
                all_skills = list(set(existing_skills + parsed_skills))
                candidate.skills = all_skills
                logger.info(f"✅ Parsed skills from resume: {parsed_skills}")
                
            resume_score = result.get('score', 0)
            if resume_score:
                candidate.resume_score = resume_score
                logger.info(f"✅ Resume score: {resume_score}")
                
        except Exception as e:
            logger.error(f"⚠️ Resume analysis failed: {str(e)} (continuing without analysis)")
        finally:
            # Clean up temp file if created
            if temp_file_created and 'temp_file' in locals():
                try:
                    os.unlink(temp_file.name)
                except:
                    pass