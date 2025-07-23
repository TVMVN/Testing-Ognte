from django.contrib import admin
from .models import Candidate
# Register your models here.
@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('user', 'seeking_job', 'registered_with_overseer')
    list_filter = ('registered_with_overseer', 'seeking_job')
    search_fields = ('user__username', 'user__email')