from django.urls import path
from . import views

urlpatterns = [
    path("health/", views.health),
    path("plans/", views.plans_list_create),
    path("plans/<int:plan_id>/", views.plan_detail),
    path("plans/<int:plan_id>/tasks/", views.plan_tasks_list),
    path("tasks/", views.task_create),
    path("tasks/<int:task_id>/", views.task_detail),
    path("tasks/<int:task_id>/status/", views.task_update_status),
]
from django.urls import path
from . import views

