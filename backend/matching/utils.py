from applications.models import JobPost
from candidates.models import Candidate


def calculate_skill_score(candidate_skills, job_skills):
    if not candidate_skills or not job_skills:
        return 0.0
    candidate_set = set(map(str.lower, candidate_skills))
    job_set = set(map(str.lower, job_skills))
    return round(len(candidate_set & job_set) / max(len(job_set), 1), 4)


def calculate_total_score(match):
    score = (
        0.20 * int(match.professional_title_match) +
        0.30 * match.skill_match_score +
        0.10 * int(match.degree_match) +
        0.10 * int(match.location_match) +
        0.10 * int(match.duration_match) +
        0.10 * int(match.industry_match) +
        0.10 * int(match.has_resume)
    )
    match.total_score = round(score, 4)
    match.save()
    return match



def match_candidate_to_jobs(candidate):
    jobs = JobPost.objects.all()
    matches = []

    for job in jobs:
        if (
            job.location.lower() == candidate.location.lower()
            and job.duration == candidate.duration_of_internship
            and job.industry.lower() == candidate.employment_type.lower()
            and all(skill.lower() in [s.lower() for s in candidate.skills] for skill in job.skills)
        ):
            matches.append(job)

    if not matches:
        matches = JobPost.objects.filter(industry__iexact=candidate.employment_type)[:10]
    return matches

def match_jobpost_to_candidates(job):
    candidates = Candidate.objects.all()
    matches = []

    for candidate in candidates:
        if (
            job.location.lower() == candidate.location.lower()
            and job.duration == candidate.duration_of_internship
            and job.industry.lower() == candidate.employment_type.lower()
            and all(skill.lower() in [s.lower() for s in candidate.skills] for skill in job.skills)
        ):
            matches.append(candidate)

    if not matches:
        matches = Candidate.objects.filter(employment_type__iexact=job.industry)[:10]
    return matches

