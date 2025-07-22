from django.db import models

class CandidateJobMatch(models.Model):
    candidate = models.ForeignKey('candidates.Candidate', on_delete=models.CASCADE)
    job_post = models.ForeignKey('applications.JobPost', on_delete=models.CASCADE)

    professional_title_match = models.BooleanField(default=False)
    skill_match_score = models.FloatField(default=0.0)
    degree_match = models.BooleanField(default=False)
    location_match = models.BooleanField(default=False)
    duration_match = models.BooleanField(default=False)
    industry_match = models.BooleanField(default=False)
    has_resume = models.BooleanField(default=False)

    total_score = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('candidate', 'job_post')
        ordering = ['-total_score']

    def __str__(self):
        return f"{self.candidate.user.email} - {self.job_post.title} ({self.total_score:.2f})"

