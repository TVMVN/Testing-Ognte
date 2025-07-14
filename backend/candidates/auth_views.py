from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Candidate
from .serializers import CandidateSerializer
from .permissions import IsCandidateUser
from universities.permissions import IsUniversityUser 
from universities.models import University
from users.utils import create_notification
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import CandidateRegisterSerializer
from users.utils import notify_admins 
from django.http import Http404

class CandidateRegisterView(APIView):
    def post(self, request):
        serializer = CandidateRegisterSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({"message": "Candidate registered successfully."}, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            errors = e.detail

            # Notify on non_field_errors (e.g., file type issues)
            non_field_errors = errors.get('non_field_errors', None)
            if non_field_errors:
                notify_admins(
                    title="Candidate Registration Error",
                    message=str(non_field_errors[0]),
                    notification_type="system"
                )

            return Response({"error": errors}, status=status.HTTP_400_BAD_REQUEST)


class CandidateProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = CandidateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        try:
            return Candidate.objects.select_related('user', 'university').get(user=self.request.user)
        except Candidate.DoesNotExist:
            raise Http404("Candidate profile not found")

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            create_notification(
                request.user,
                'Profile Updated',
                'Your candidate profile has been updated successfully.',
                'profile_update'
            )
        return response



class UniversityCandidatesListView(generics.ListAPIView):
    serializer_class = CandidateSerializer
    permission_classes = [permissions.IsAuthenticated, IsUniversityUser]

    def get_queryset(self):
        try:
            university = University.objects.get(user=self.request.user) 
            queryset = Candidate.objects.select_related('user', 'university')
        except:
            pass
