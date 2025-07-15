from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Recruiter
from .auth_serializers import RecruiterSerializer
from .permissions import IsRecruiterUser
from users.utils import create_notification


class RecruiterProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = RecruiterSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiterUser]

    def get_object(self):
        try:
            return Recruiter.objects.select_related('user').get(user=self.request.user)
        except Recruiter.DoesNotExist:
            return Response(
                {'error': 'Recruiter profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            create_notification(
                request.user,
                'Profile Updated',
                'Your recruiter profile has been updated successfully.',
                'profile_update'
            )
        return response


class RecruiterListView(generics.ListAPIView):
    serializer_class = RecruiterSerializer
    permission_classes = [permissions.IsAuthenticated]  # Only authenticated users can see recruiters
    
    def get_queryset(self):
        queryset = Recruiter.objects.select_related('user').filter(user__is_active=True)
        
        # Add search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(company_name__icontains=search)
            
        # Add industry filter
        industry = self.request.query_params.get('industry', None)
        if industry:
            queryset = queryset.filter(industry__icontains=industry)
            
        return queryset
