from django.core.management.base import BaseCommand
from candidates.models import Candidate
from applications.models import JobPost
from matching.models import CandidateJobMatch
from matching.utils import calculate_skill_score, calculate_total_score


class Command(BaseCommand):
    help = "Run matching algorithm for all candidates and job posts."

    def handle(self, *args, **kwargs):
        candidates = Candidate.objects.all()
        job_posts = JobPost.active_jobs.all()
        match_count = 0

        for candidate in candidates:
            for job in job_posts:
                if CandidateJobMatch.objects.filter(candidate=candidate, job_post=job).exists():
                    continue

                match = CandidateJobMatch(
                    candidate=candidate,
                    job_post=job,
                    professional_title_match=(candidate.professional_title.strip().lower() == job.title.strip().lower()),
                    skill_match_score=calculate_skill_score(candidate.skills, job.required_skills),
                    degree_match=('computer' in candidate.degree.lower() and 'tech' in job.industry.lower()),
                    location_match=(candidate.city.lower() == job.location.lower()),
                    duration_match=(str(candidate.duration_of_internship) == str(job.duration_of_internship)),
                    industry_match=('tech' in job.industry.lower() and 'computer' in candidate.degree.lower()),
                    has_resume=bool(candidate.resume),
                )
                calculate_total_score(match)
                match.save()
                match_count += 1

        self.stdout.write(self.style.SUCCESS(f"✅ Matching completed. {match_count} matches created."))
