from django.contrib import admin
from .models import CandidateJobMatch
from django.core.management import call_command
from django.contrib import messages

@admin.register(CandidateJobMatch)
class CandidateJobMatchAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'job_post', 'total_score', 'created_at')
    list_filter = ('location_match', 'industry_match', 'duration_match', 'professional_title_match')
    search_fields = ('candidate__user__email', 'job_post__title')

    actions = ['run_matching_engine']

    def run_matching_engine(self, request, queryset):
        try:
            call_command('run_matching')  # 👈 Calls our custom management command
            self.message_user(request, "✅ Matching engine executed successfully.", messages.SUCCESS)
        except Exception as e:
            self.message_user(request, f"❌ Error running matching engine: {e}", messages.ERROR)

    run_matching_engine.short_description = "⚙️ Run Matching Engine (All Candidates & Jobs)"
