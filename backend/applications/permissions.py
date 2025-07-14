from rest_framework import permissions

class IsCandidate(permissions.BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'candidate')

class IsRecruiter(permissions.BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'recruiter')