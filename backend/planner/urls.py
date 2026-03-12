from django.urls import path
from . import views

urlpatterns = [
    path("health/", views.health),
    path("dashboard", views.dashboard),
    path("auth/register/", views.auth_register),
    path("auth/login/", views.auth_login),
    path("auth/logout/", views.auth_logout),
    path("auth/session/", views.auth_session),
    path("plans/", views.plans_list_create),
    path("plans/<int:plan_id>/", views.plan_detail),
    path("plans/<int:plan_id>/tasks/", views.plan_tasks_list),
    path("tasks/", views.task_create),
    path("tasks/<int:task_id>/", views.task_detail),
    path("tasks/<int:task_id>/status/", views.task_update_status),
    path("tasks/<int:task_id>/schedule-entries/", views.task_schedule_entries),
    path("schedule-entries/<int:entry_id>/", views.schedule_entry_detail),
    path("schedule-entries/<int:entry_id>/progress-logs/", views.schedule_entry_progress_logs),
    path("progress-logs/<int:log_id>/", views.progress_log_detail),
]
