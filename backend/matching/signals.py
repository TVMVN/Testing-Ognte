from django.db.models.signals import post_save
from django.dispatch import receiver
from candidates.models import Candidate
from applications.models import JobPost, Application
from .models import CandidateJobMatch
from .utils import calculate_skill_score, calculate_total_score

@receiver(post_save, sender=Candidate)
def auto_match_on_candidate_save(sender, instance, **kwargs):
    candidate = instance
    jobs = JobPost.active_jobs.all()

    for job in jobs:
        if CandidateJobMatch.objects.filter(candidate=candidate, job_post=job).exists():
            continue
        _create_match(candidate, job)


@receiver(post_save, sender=JobPost)
def auto_match_on_jobpost_save(sender, instance, **kwargs):
    job = instance
    if not job.is_active:
        return

    candidates = Candidate.objects.all()
    for candidate in candidates:
        if CandidateJobMatch.objects.filter(candidate=candidate, job_post=job).exists():
            continue
        _create_match(candidate, job)

def _create_match(candidate, job):
    from applications.models import Application

    professional_title_match = candidate.professional_title.strip().lower() == job.title.strip().lower()
    skill_score = calculate_skill_score(candidate.skills, job.required_skills)
    location_match = candidate.city.strip().lower() == job.location.strip().lower()

    # Try to find an application from the candidate to this job
    application = Application.objects.filter(candidate=candidate, job_post=job).first()
    if application:
        duration_match = str(application.duration_of_internship) == str(job.duration_of_internship)
    else:
        duration_match = False  # or True, depending on your logic

    industry_match = (
        candidate.degree and 
        candidate.professional_title.strip().lower() == job.industry.strip().lower()
    )
    has_resume = bool(candidate.resume)

    match = CandidateJobMatch(
        candidate=candidate,
        job_post=job,
        professional_title_match=professional_title_match,
        skill_match_score=skill_score,
        degree_match=True,  # Placeholder
        location_match=location_match,
        duration_match=duration_match,
        industry_match=industry_match,
        has_resume=has_resume,
    )
    calculate_total_score(match)
    match.save()
