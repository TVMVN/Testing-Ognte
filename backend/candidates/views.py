from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Candidate
from .serializers import CandidateProfileSerializer, MyApplicationSerializer
from .permissions import IsCandidateUser
from applications.models import JobPost, Application
from applications.serializers import ApplicationCreateSerializer
from .utils import create_notification
from rest_framework.exceptions import ValidationError
from rest_framework import status, permissions
from rest_framework.views import APIView

class MyApplicationsView(generics.ListAPIView):
    serializer_class = MyApplicationSerializer
    permission_classes = [IsAuthenticated, IsCandidateUser]

    def get_queryset(self):
        return Application.objects.filter(candidate=self.request.user.candidate_profile.first())

class ApplyToJobView(APIView):
    permission_classes = [IsAuthenticated, IsCandidateUser]

    def post(self, request, job_id, *args, **kwargs):
        try:
            candidate = Candidate.objects.get(user=request.user)
        except Candidate.DoesNotExist:
            return Response({'error': 'Candidate profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            job_post = JobPost.objects.get(pk=job_id)
        except JobPost.DoesNotExist:
            return Response({'error': 'Job post not found.'}, status=status.HTTP_404_NOT_FOUND)

        print(f"🔍 Serializer context candidate: {candidate}")
        print(f"🔍 Serializer context job_post: {job_post}")

        context = {'request': request, 'candidate': candidate, 'job_post': job_post}
        serializer = ApplicationCreateSerializer(data=request.data, context=context)

        if serializer.is_valid():
            application = serializer.save()  # <- ✅ Don't manually pass applicant or job_post
            return Response({'message': 'Application submitted successfully.'}, status=status.HTTP_201_CREATED)
        else:
            print("❌ Serializer errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
