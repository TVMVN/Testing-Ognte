from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient, force_authenticate
from matching.models import CandidateJobMatch
from matching.permissions import IsCandidateUser, IsRecruiterUser
from candidates.models import Candidate
from recruiters.models import Recruiter
from applications.models import JobPost
from matching.utils import calculate_skill_score, calculate_total_score

User = get_user_model()

class MatchingSignalAndPermissionTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='user', email='user@example.com', password='testpass')
        self.candidate_user = User.objects.create_user(username='candidate', email='cand@example.com', password='testpass')
        self.recruiter_user = User.objects.create_user(username='recruiter', email='rec@example.com', password='testpass')
        self.candidate = Candidate.objects.create(user=self.candidate_user, professional_title="Software Engineer", degree="Computer Science", graduation_year=2024, phone="1234567890", city="Lagos", gender="Male", languages="English", employment_type="intern", resume="resume.pdf", location="Lagos", skills=["python", "django"], duration_of_internship=6)
        self.recruiter = Recruiter.objects.create(user=self.recruiter_user, company_name="Tech Inc", recruiter_name="John Doe", phone="1234567890", location="Lagos", industry="Tech", company_size="10-50", duration_of_internship="6")

    def test_is_candidate_user_permission(self):
        request = RequestFactory().get('/')
        request.user = self.candidate_user
        perm = IsCandidateUser()
        self.assertTrue(perm.has_permission(request, None))

    def test_is_recruiter_user_permission(self):
        request = RequestFactory().get('/')
        request.user = self.recruiter_user
        perm = IsRecruiterUser()
        self.assertTrue(perm.has_permission(request, None))

    def test_run_auto_matching_signal(self):
        job = JobPost.objects.create(recruiter=self.recruiter, title="Software Engineer", description="Job desc", location="Lagos", required_skills=["python", "django"], duration_of_internship=6, industry="Tech", is_active=True)
        match = CandidateJobMatch.objects.filter(candidate=self.candidate, job_post=job)
        self.assertTrue(match.exists())


class MatchingViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin_user = User.objects.create_superuser(username='admin', email='admin@example.com', password='pass')
        self.recruiter_user = User.objects.create_user(username='recruiter', email='recruiter@example.com', password='pass')
        self.candidate_user = User.objects.create_user(username='candidate', email='candidate@example.com', password='pass')

        self.recruiter = Recruiter.objects.create(user=self.recruiter_user, company_name="Tech Inc", recruiter_name="Jane", phone="1234567890", location="Lagos", industry="Tech", company_size="11-50", duration_of_internship="6")
        self.candidate = Candidate.objects.create(user=self.candidate_user, professional_title="Software Engineer", degree="Computer Science", graduation_year=2025, phone="1234567890", city="Lagos", gender="Male", languages="English", employment_type="intern", resume="resume.pdf", location="Lagos", skills=["python", "django"], duration_of_internship=6)

        self.job_post = JobPost.objects.create(recruiter=self.recruiter, title="Software Engineer", description="...", location="Lagos", required_skills=["python", "django"], duration_of_internship=6, industry="Tech", is_active=True)

        CandidateJobMatch.objects.create(candidate=self.candidate, job_post=self.job_post, professional_title_match=True, skill_match_score=1.0, degree_match=True, location_match=True, duration_match=True, industry_match=True, has_resume=True, total_score=1.0)

    def test_admin_can_run_matching_engine(self):
        self.client.login(email='admin@example.com', password='pass')
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('run-matching-engine')
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)

    def test_candidate_can_view_matches(self):
        self.client.login(email='candidate@example.com', password='pass')
        self.client.force_authenticate(user=self.candidate_user)
        url = reverse('candidate-matches')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(response.data) >= 1)

    def test_recruiter_can_view_matches(self):
        self.client.login(email='recruiter@example.com', password='pass')
        self.client.force_authenticate(user=self.recruiter_user)
        url = reverse('recruiter-top-matches')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(response.data) >= 1)
