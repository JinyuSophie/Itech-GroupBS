from django.conf import settings
from django.db import models


class StudyPlan(models.Model):
    # Plans are owned per user so all downstream task and schedule queries can be scoped
    # through the authenticated account.
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=120)
    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return self.title


class Task(models.Model):
    STATUS_NOT_STARTED = "not_started"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_COMPLETED = "completed"
    STATUS_CHOICES = [
        (STATUS_NOT_STARTED, "Not Started"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_COMPLETED, "Completed"),
    ]

    # Tasks inherit ownership indirectly through their parent plan.
    plan = models.ForeignKey(StudyPlan, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_NOT_STARTED)
    deadline_date = models.DateField()
    estimated_effort_hours = models.FloatField()

    def __str__(self):
        return self.title


class ScheduleEntry(models.Model):
    # A schedule entry represents an allocated study session rather than a generic calendar event.
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    scheduled_date = models.DateField()
    planned_effort_hours = models.FloatField()
    is_rescheduled = models.BooleanField(default=False)


class ProgressLog(models.Model):
    # Progress logs capture the actual effort spent so weekly summaries can compare plan vs reality.
    schedule_entry = models.ForeignKey(ScheduleEntry, on_delete=models.CASCADE)
    actual_effort_hours = models.FloatField()
    completed_flag = models.BooleanField(default=False)
