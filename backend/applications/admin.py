from django.contrib import admin
from .models import JobPost, Salary, Application

@admin.register(JobPost)
class JobPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'recruiter', 'location', 'is_active', 'created_at')
    list_filter = ('is_active', 'location', 'created_at')
    search_fields = ('title', 'description', 'skills', 'recruiter__user__email')

@admin.register(Salary)
class SalaryAdmin(admin.ModelAdmin):
    list_display = ('amount', 'currency', 'status', 'payment_frequency')
    list_filter = ('currency', 'status', 'payment_frequency')

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('job_post', 'candidate', 'status', 'applied_at')
    list_filter = ('status', 'applied_at')
    search_fields = ('job_post__title', 'candidate__user__email')