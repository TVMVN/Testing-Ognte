from django.db.models.signals import post_save
from django.dispatch import receiver
from candidates.models import Candidate
from applications.models import JobPost
from .models import CandidateJobMatch
from .utils import calculate_skill_score, calculate_total_score

@receiver(post_save, sender=Candidate)
@receiver(post_save, sender=JobPost)
def run_auto_matching(sender, instance, **kwargs):
    candidates = Candidate.objects.all()
    jobs = JobPost.objects.filter(is_active=True)

    for candidate in candidates:
        for job in jobs:
            # Prevent duplicates
            if CandidateJobMatch.objects.filter(candidate=candidate, job_post=job).exists():
                continue

            # Match logic
            professional_title_match = candidate.professional_title.strip().lower() == job.title.strip().lower()
            skill_score = calculate_skill_score(candidate.skills, job.required_skills)
            degree_match = ('computer' in candidate.degree.lower() and 'tech' in job.industry.lower())
            location_match = (candidate.city.lower() == job.location.lower())
            duration_match = str(candidate.duration_of_internship) == str(job.duration_of_internship)
            industry_match = ('tech' in job.industry.lower() and 'computer' in candidate.degree.lower())
            has_resume = bool(candidate.resume)

            # Create and save match
            match = CandidateJobMatch(
                candidate=candidate,
                job_post=job,
                professional_title_match=professional_title_match,
                skill_match_score=skill_score,
                degree_match=degree_match,
                location_match=location_match,
                duration_match=duration_match,
                industry_match=industry_match,
                has_resume=has_resume,
            )
            calculate_total_score(match)
            match.save()
