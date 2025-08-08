from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from .models import Candidate
from .permissions import IsCandidateUser
from .serializers import CandidateProfileSerializer, MyApplicationSerializer


from candidates.serializers import ApplicationCreateSerializer  
from applications.models import JobPost, Application
from matching.models import CandidateJobMatch
from matching.serializers import CandidateJobMatchSerializer

from users.utils import create_notification


class MyApplicationsView(generics.ListAPIView):
    serializer_class = MyApplicationSerializer
    permission_classes = [IsAuthenticated, IsCandidateUser]

    def get_queryset(self):
        return Application.objects.filter(candidate=self.request.user.candidate_profile).order_by('-applied_at')


class ApplyToJobView(APIView):
    permission_classes = [IsAuthenticated, IsCandidateUser]

    def post(self, request, job_id, *args, **kwargs):
        print(">>> ApplyToJobView triggered")
        print("Incoming data:", request.data)
        print("User:", request.user)
        candidate = getattr(request.user, 'candidate_profile', None)
        if not candidate:
            return Response({'error': 'Candidate profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        job_post = JobPost.objects.filter(pk=job_id, is_active=True).first()
        if not job_post:
            return Response({'error': 'Job post not found or inactive.'}, status=status.HTTP_404_NOT_FOUND)

        context = {'request': request, 'candidate': candidate, 'job_post': job_post}
        serializer = ApplicationCreateSerializer(data=request.data, context=context)

        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Application submitted successfully.'}, status=status.HTTP_201_CREATED)

        print("Serializer errors:", serializer.errors)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CandidateDashboardMatchesView(APIView):
    permission_classes = [IsAuthenticated, IsCandidateUser]

    def get(self, request):
        candidate = request.user.candidate_profile.first()
        if not candidate:
            return Response({'error': 'Candidate profile not found.'}, status=404)

        matches = CandidateJobMatch.objects.filter(candidate=candidate).order_by('-total_score')[:10]
        serializer = CandidateJobMatchSerializer(matches, many=True)
        return Response({'top_matches': serializer.data})
    



class CandidateStatsView(APIView):
    permission_classes = [IsAuthenticated, IsCandidateUser]

    def get(self, request):
        candidate = request.user.candidate_profile.first()
        applications = Application.objects.filter(candidate=candidate)
        matches = CandidateJobMatch.objects.filter(candidate=candidate)

        stats = {
            "total_applications": applications.count(),
            "accepted_applications": applications.filter(status="accepted").count(),
            "rejected_applications": applications.filter(status="rejected").count(),
            "total_matches": matches.count(),
            "top_matched_jobs": [
                {
                    "job_title": match.job_post.title,
                    "score": match.total_score
                }
                for match in matches.order_by("-total_score")[:5]
            ]
        }
        return Response(stats)


class ToggleUniversityViewPermission(APIView):
    permission_classes = [IsAuthenticated, IsCandidateUser]

    def post(self, request):
        candidate = getattr(request.user, 'candidate_profile', None)
        if not candidate:
            return Response({'error': 'Candidate profile not found.'}, status=404)

        candidate.can_university_view = not candidate.can_university_view
        candidate.save()

        return Response({
            'can_university_view': candidate.can_university_view,
            'message': 'University view permission updated.'
        }, status=200)



class CandidateAcceptOfferView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        application = get_object_or_404(Application, id=pk, candidate=request.user.candidate_profile)

        if application.offer_response == 'accepted':
            return Response({'detail': 'Offer already accepted.'}, status=400)

        application.offer_response = 'accepted'
        application.status = 'accepted'
        application.save()

        recruiter_user = application.job_post.recruiter.user

        # ✅ Email recruiter
        send_mail(
            subject="Job Offer Accepted",
            message=f"{request.user.username} has accepted your job offer for '{application.job_post.title}'.",
            from_email='noreply@yourdomain.com',
            recipient_list=[recruiter_user.email],
        )

        # ✅ Notify candidate with recruiter contact
        create_notification(
            user=request.user,
            title="You accepted the job offer",
            message=f"Recruiter: {recruiter_user.username}, Email: {recruiter_user.email}",
            notification_type="job_offer"
        )

        candidate_profile = request.user.candidate_profile
        if candidate_profile.can_university_view and candidate_profile.university:
            send_mail(
                subject="Candidate Accepted Offer",
                message=f"{request.user.get_full_name()} has accepted a job offer for {application.job_post.title}.",
                recipient_list=[candidate_profile.university.user.email],
            )

        # ✅ Reject all other pending applications from the same candidate
        Application.objects.filter(
            candidate=request.user.candidate_profile,
            status='pending' 
        ).exclude(id=application.id).update(status='rejected')

        return Response({'detail': 'Offer accepted. Recruiter notified. Other applications rejected.'})

class CandidateDenyOfferView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        application = get_object_or_404(Application, id=pk, candidate=request.user.candidate_profile)

        if application.offer_response == 'denied':
            return Response({'detail': 'Offer already denied.'}, status=400)

        application.offer_response = 'denied'
        application.status = 'rejected'
        application.save()

        recruiter_user = application.job_post.recruiter.user

        # ✅ Email recruiter
        send_mail(
            subject="Job Offer Denied",
            message=f"{request.user.username} has denied the job offer for '{application.job_post.title}'.",
            from_email='noreply@yourdomain.com',
            recipient_list=[recruiter_user.email],
        )

        # ✅ Notify candidate
        create_notification(
            user=request.user,
            title="You denied the job offer",
            message=f"You have successfully denied the offer for '{application.job_post.title}'.",
            notification_type="job_offer"
        )

        return Response({'detail': 'Offer denied. Recruiter notified.'})


class ResumeAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        candidate = getattr(request.user, 'candidate_profile', None)
        if not candidate:
            return Response({"error": "Candidate profile not found."}, status=404)

        serializer = CandidateProfileSerializer(candidate)
        return Response({
            "skills": serializer.data.get("skills", []),
            "resume_score": serializer.data.get("resume_score", 0)
        })