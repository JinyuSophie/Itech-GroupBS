from django.conf import settings
from django.db import models


class StudyPlan(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=120)
    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return self.title


class Task(models.Model):
    plan = models.ForeignKey(StudyPlan, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    status = models.CharField(max_length=50)
    deadline_date = models.DateField()
    estimated_effort_hours = models.FloatField()

    def __str__(self):
        return self.title


class ScheduleEntry(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    scheduled_date = models.DateField()
    planned_effort_hours = models.FloatField()
    is_rescheduled = models.BooleanField(default=False)


class ProgressLog(models.Model):
    schedule_entry = models.ForeignKey(ScheduleEntry, on_delete=models.CASCADE)
    actual_effort_hours = models.FloatField()
    completed_flag = models.BooleanField(default=False)