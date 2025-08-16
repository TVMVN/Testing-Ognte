from difflib import SequenceMatcher

from applications.models import Application, JobPost
from candidates.models import Candidate
from matching.models import CandidateJobMatch

# ---------- Synonym & Inference Helpers ----------

TITLE_SYNONYMS = {
    "frontend developer": ["frontend engineer", "web developer", "react developer"],
    "backend developer": ["backend engineer", "server-side developer"],
    "legal researcher": ["law assistant", "legal analyst", "legal associate"],
    # Add more as needed
}

def titles_match(candidate_title, job_title):
    candidate_title = candidate_title.lower()
    job_title = job_title.lower()

    if candidate_title == job_title:
        return True

    for base, synonyms in TITLE_SYNONYMS.items():
        if (candidate_title == base and job_title in synonyms) or \
           (job_title == base and candidate_title in synonyms) or \
           (candidate_title in synonyms and job_title in synonyms):
            return True

    return SequenceMatcher(None, candidate_title, job_title).ratio() > 0.8

def infer_industry_from_title(title):
    title = title.lower()
    if "developer" in title or "engineer" in title:
        return "Tech"
    if "legal" in title or "law" in title:
        return "Law"
    return None

# ---------- Score Calculators ----------

def calculate_skill_score(candidate_skills, job_required_skills):
    if not candidate_skills or not job_required_skills:
        return 0.0
    candidate_set = set(map(str.lower, candidate_skills))
    job_set = set(map(str.lower, job_required_skills))
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

# ---------- Matching Core ----------

def run_matching_engine():
    applications = Application.objects.select_related('candidate').all()
    job_posts = JobPost.active_jobs.all()

    for application in applications:
        candidate = application.candidate
        for job in job_posts:
            if candidate.location != job.location:
                continue

            candidate_industry = candidate.industry or infer_industry_from_title(candidate.professional_title)
            job_industry = job.industry or infer_industry_from_title(job.professional_title)
            if candidate_industry != job_industry:
                continue

            if not titles_match(candidate.professional_title, job.professional_title):
                continue

            if application.duration_of_internship != job.duration:
                continue

            skill_score = calculate_skill_score(candidate.skills, job.skills)
            total_score = round(skill_score * 100, 2)

            CandidateJobMatch.objects.update_or_create(
                candidate=candidate,
                job_post=job,
                defaults={"score": total_score}
            )

# ---------- Recommendation Functions ----------

def match_candidate_to_jobs(candidate, skill_threshold=0.4):
    matches = []
    application = Application.objects.filter(candidate=candidate).first()

    for job in JobPost.objects.all():
        skill_score = calculate_skill_score(candidate.skills, job.skills)
        if (
            job.location.lower() == candidate.location.lower()
            and application and job.duration == application.duration_of_internship
            and job.industry.lower() == candidate.employment_type.lower()
            and skill_score >= skill_threshold
        ):
            matches.append(job)

    if not matches:
        matches = JobPost.objects.filter(industry__iexact=candidate.employment_type)[:10]
    return matches

def match_jobpost_to_candidates(job, skill_threshold=0.4):
    matches = []
    for candidate in Candidate.objects.all():
        application = Application.objects.filter(candidate=candidate).first()
        skill_score = calculate_skill_score(candidate.skills, job.skills)
        if (
            job.location.lower() == candidate.location.lower()
            and application and job.duration == application.duration_of_internship
            and job.industry.lower() == candidate.employment_type.lower()
            and skill_score >= skill_threshold
        ):
            matches.append(candidate)

    if not matches:
        matches = Candidate.objects.filter(employment_type__iexact=job.industry)[:10]
    return matches
