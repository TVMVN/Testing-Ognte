from rest_framework.permissions import BasePermission

class IsCandidateUser(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'candidate_profile')


class IsRecruiterUser(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'recruiter_profile')


class IsRecruiterOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return hasattr(request.user, 'recruiter_profile') and obj.job_post.recruiter.user == request.user

