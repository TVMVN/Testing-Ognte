from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist
from .models import University
from .serializers import UniversitySerializer
from .permissions import IsUniversityUser 
from users.utils import create_notification


class UniversityProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UniversitySerializer
    permission_classes = [permissions.IsAuthenticated, IsUniversityUser]

    def get_object(self):
        try:
            return University.objects.select_related('user').get(user=self.request.user)
        except University.DoesNotExist:
            return Response(
                {'error': 'University profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            create_notification(
                request.user,
                'Profile Updated',
                'Your university profile has been updated successfully.',
                'profile_update'
            )
        return response


class UniversityListView(generics.ListAPIView):
    serializer_class = UniversitySerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = University.objects.select_related('user').filter(user__is_active=True)
        
        # Add search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
            
        # Add location filter
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(location__icontains=location)
            
        return queryset

