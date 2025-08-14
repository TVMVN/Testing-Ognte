from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count
from django.utils.timezone import now
from datetime import timedelta
from .permissions import IsUniversityUser

from candidates.models import Candidate
from applications.models import Application, JobPost



from django.db.models import Count, Q, F
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import viewsets, permissions
from applications.models import Application
from candidates.models import Candidate


from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from recruiters.models import Recruiter  
from applications.models import JobPost, Application

class UniversityDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsUniversityUser]

    def get(self, request):
        university = request.user.university_profile

        # === CORE METRICS ===
        total_students = Candidate.objects.filter(university=university).count()

        total_applications = Application.objects.filter(
            candidate__university=university
        ).count()

        accepted_applications = Application.objects.filter(
            candidate__university=university,
            status='accepted'
        ).count()

        success_rate = (accepted_applications / total_applications * 100) if total_applications > 0 else 0

        active_jobs = JobPost.objects.filter(is_active=True).count()

        # === APPLICATION TREND (Last Month vs This Month) ===
        now_date = now()
        current_month_apps = Application.objects.filter(
            candidate__university=university,
            applied_at__year=now_date.year,
            applied_at__month=now_date.month
        ).count()

        last_month_date = (now_date.replace(day=1) - timedelta(days=1))
        last_month_apps = Application.objects.filter(
            candidate__university=university,
            applied_at__year=last_month_date.year,
            applied_at__month=last_month_date.month
        ).count()

        if last_month_apps == 0:
            trend_percent = 100 if current_month_apps > 0 else 0
        else:
            trend_percent = ((current_month_apps - last_month_apps) / last_month_apps) * 100

        trend_label = f"{trend_percent:.0f}% {'increase' if trend_percent >= 0 else 'decrease'} from last month"

        # === TOP HIRING INDUSTRIES ===
        top_industries = (
            JobPost.objects
            .filter(applications__candidate__university=university)
            .values("industry")
            .annotate(jobs=Count("id", distinct=True))
            .order_by("-jobs")[:5]
        )

            # === TOP HIRING INDUSTRIES (last 3 months) ===
        three_months_ago = now_date - timedelta(days=90)
        top_industries = (
            JobPost.objects
            .filter(
                applications__candidate__university=university,
                applications__applied_at__gte=three_months_ago
            )
            .values("industry")
            .annotate(jobs=Count("id", distinct=True))
            .order_by("-jobs")[:5]
        )

        # === MONTHLY ENGAGEMENT ===
        monthly_labels = []
        monthly_applications = []
        monthly_engagement = []

        current_year = now_date.year
        for month in range(1, 13):
            month_name = now_date.replace(month=month, day=1).strftime("%b")
            monthly_labels.append(month_name)

            # Applications per month
            apps_count = Application.objects.filter(
                candidate__university=university,
                applied_at__year=current_year,
                applied_at__month=month
            ).count()
            monthly_applications.append(apps_count)

            # Engagement = unique active students
            engaged_students = Candidate.objects.filter(
                university=university,
                application__applied_at__year=current_year,
                application__applied_at__month=month
            ).distinct().count()
            monthly_engagement.append(engaged_students)

        # === TOP STUDENTS ===
        top_students_qs = (
            Application.objects
            .filter(candidate__university=university)
            .values(
                "candidate__user__first_name",
                "candidate__user__last_name",
                "status",
                "job_post__title",
                "candidate__course"
            )
            .annotate(app_count=Count("id"))
            .order_by("-app_count")[:10]
        )

        top_students = [
            {
                "name": f"{s['candidate__user__first_name']} {s['candidate__user__last_name']}",
                "status": s["status"].capitalize(),
                "job_title": s["job_post__title"],
                "course": s["candidate__course"]
            }
            for s in top_students_qs
        ]

        # === RESPONSE PAYLOAD ===
        return Response({
            "welcome_message": f"Welcome back, {university.name} Admin! 👋",
            "sub_message": f"Here's what's happening at {university.name} today",
            "stats": {
                "total_students": total_students,
                "applications": total_applications,
                "success_rate": f"{success_rate:.0f}%",
                "active_jobs": active_jobs
            },
            "application_overview": {
                "description": "Student application breakdown",
                "total_students": total_students,
                "trend": trend_label
            },
            "top_industries": list(top_industries),
            "monthly_engagement": {
                "labels": monthly_labels,
                "applications": monthly_applications,
                "engagement": monthly_engagement
            },
            "student_performance": {
                "description": "Detailed breakdown of student achievements and progress",
                "top_students": top_students
            }
        })


class OverseerViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsUniversityUser]  # Ensure user is logged in

    @action(detail=False, methods=['get'])
    def student_activity_dashboard(self, request):
        # Get university linked to logged-in admin
        university = getattr(request.user, "university_profile", None)
        if not university:
            return Response({"error": "No university linked to this account"}, status=403)

        # Annotate students with count of accepted offers
        students = Candidate.objects.filter(university=university).annotate(
            accepted_offers=Count(
                'applications',
                filter=Q(applications__status='accepted'),
                distinct=True
            )
        )

        # Categorization
        top_performers_qs = students.filter(accepted_offers__gte=2)
        average_qs = students.filter(accepted_offers=1)
        needs_support_qs = students.filter(accepted_offers=0)

        total_students = students.count()
        top_performers = top_performers_qs.count()
        average_performers = average_qs.count()
        needs_support = needs_support_qs.count()

        success_rate = round((top_performers / total_students) * 100, 2) if total_students else 0

        def get_student_list(qs):
            return list(qs.order_by("-accepted_offers").values(
                name=F('user__first_name'),  # change to full name if needed
                status=F('accepted_offers'),
                job_title=F('professional_title'),
                course=F('degree')
            )[:10])

        data = {
            "summary": {
                "total_students": total_students,
                "top_performers": top_performers,
                "average_performers": average_performers,
                "needs_support": needs_support,
                "success_rate": f"{success_rate}%",
                "performance_rate": f"{success_rate}%"
            },
            "students": {
                "top_performing_students": get_student_list(top_performers_qs),
                "average_students": get_student_list(average_qs),
                "below_average_students": get_student_list(needs_support_qs)
            }
        }

        return Response(data)



class RecruiterEngagementHubViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        university = getattr(request.user, 'university_profile', None)
        if not university:
            return Response({"detail": "Only university accounts can access this endpoint."}, status=403)

        # All jobs linked to this university's students
        jobs_qs = JobPost.objects.filter(
            applications__candidate__university=university
        ).distinct()

        recruiters_qs = Recruiter.objects.filter(
            job_posts__in=jobs_qs
        ).distinct()

        # === OVERVIEW METRICS ===
        total_recruiters = recruiters_qs.count()

        active_jobs_qs = jobs_qs.filter(is_active=True)
        active_jobs_count = active_jobs_qs.count()

        active_partnerships = recruiters_qs.filter(
            job_posts__in=active_jobs_qs
        ).distinct().count()

        jobs_with_apps = active_jobs_qs.annotate(
            app_count=Count('applications')
        ).filter(app_count__gt=0)

        avg_engagement = (
            (jobs_with_apps.count() / active_jobs_count) * 100 if active_jobs_count > 0 else 0
        )

        top_industry = recruiters_qs.values('industry')\
                                    .annotate(cnt=Count('id'))\
                                    .order_by('-cnt')\
                                    .first()

        # === MOST HIRING ===
        most_hiring = recruiters_qs.filter(
            job_posts__applications__candidate__university=university,
            job_posts__applications__status='accepted'
        ).annotate(
            accepted_offers=Count(
                'job_posts__applications',
                filter=Q(job_posts__applications__status='accepted')
            )
        ).order_by('-accepted_offers')

        most_hiring_data = [{
            "recruiter": rec.recruiter_name or rec.user.get_full_name() or rec.user.username,
            "accepted_offers": rec.accepted_offers,
            "company_name": rec.company_name,
            "recruiter_name": rec.recruiter_name,
            "phone": rec.phone,
            "website": rec.website,
            "location": rec.location,
            "industry": rec.industry,
            "company_size": rec.company_size,
            "bio": rec.bio,
            "logo": request.build_absolute_uri(rec.logo.url) if rec.logo else None,
            "accepted_offers": rec.accepted_offers
        

        } for rec in most_hiring]

        # === FINAL RESPONSE ===
        return Response({
            "overview": {
                "total_recruiters": total_recruiters,
                "active_partnerships": active_partnerships,
                "active_jobs": active_jobs_count,
                "avg_engagement": avg_engagement,
                "top_industry": top_industry['industry'] if top_industry else None
            },
            "most_hiring": most_hiring_data
        })
