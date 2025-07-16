from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from candidates.models import Candidate
from recruiters.models import Recruiter
from applications.models import JobPost
import tempfile

User = get_user_model()

class ApplyToJobTest(APITestCase):
    def setUp(self):
        self.client = APIClient()

        # ✅ Create unique recruiter and job
        self.recruiter_user = User.objects.create_user(
            username='recruiter', email='recruiter@example.com', password='pass', role='recruiter'
        )
        self.recruiter = Recruiter.objects.create(user=self.recruiter_user)

        self.job = JobPost.objects.create(
            recruiter=self.recruiter,
            title="Frontend Developer",
            description="Build cool stuff",
            location="Remote"
        )

        # ✅ Create unique candidate
        self.candidate_user = User.objects.create_user(
            username='candidate', email='candidate@example.com', password='pass', role='candidate'
        )
        self.candidate = Candidate.objects.create(
            user=self.candidate_user,
            professional_title='Dev',
            university=None,
            degree='BSc',
            graduation_year=2023,
            phone='123456789',
            city='Lagos',
            gender='M',
            languages='English',
            employment_type='Full-time'
        )

    def test_candidate_applies_to_job(self):
        self.client.force_authenticate(user=self.candidate_user)

        # ✅ Simulate file upload with a temporary file
        temp_resume = tempfile.NamedTemporaryFile(suffix=".pdf")
        temp_resume.write(b"Fake resume content")
        temp_resume.seek(0)

        response = self.client.post(
            f'/api/candidates/apply/{self.job.id}/',
            {
                'resume': temp_resume,
                'cover_letter': 'I am passionate about frontend development.'
            },
            format='multipart'
        )

        print("Response data:", response.data)  # ✅ Add this
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
