from django.contrib import admin
from .models import StudyPlan, Task, ScheduleEntry, ProgressLog

admin.site.register(StudyPlan)
admin.site.register(Task)
admin.site.register(ScheduleEntry)
admin.site.register(ProgressLog)