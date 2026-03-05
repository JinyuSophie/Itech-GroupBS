from django.shortcuts import render

import json
from datetime import date

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpRequest, HttpResponseNotAllowed, HttpResponseBadRequest
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt

from .models import StudyPlan, Task


def _json_body(request: HttpRequest) -> dict:
    """Safely parse JSON body. Return {} if empty."""
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON")


def health(request: HttpRequest):
    return JsonResponse({"status": "ok"})


@login_required
@csrf_exempt
def plans_list_create(request: HttpRequest):
    """
    GET  /api/plans/        -> list current user's plans
    POST /api/plans/        -> create a new plan (title, start_date, end_date)
    """
    user = request.user

    if request.method == "GET":
        plans = StudyPlan.objects.filter(user=user).order_by("-id")
        data = [
            {
                "id": p.id,
                "title": p.title,
                "start_date": p.start_date.isoformat(),
                "end_date": p.end_date.isoformat(),
            }
            for p in plans
        ]
        return JsonResponse({"plans": data})

    if request.method == "POST":
        try:
            body = _json_body(request)
        except ValueError as e:
            return HttpResponseBadRequest(str(e))

        title = (body.get("title") or "").strip()
        start_date_str = body.get("start_date")
        end_date_str = body.get("end_date")

        if not title or not start_date_str or not end_date_str:
            return HttpResponseBadRequest("Missing required fields: title, start_date, end_date")

        # Django will validate date format when saving if passed as date objects
        try:
            start = date.fromisoformat(start_date_str)
            end = date.fromisoformat(end_date_str)
        except ValueError:
            return HttpResponseBadRequest("Dates must be ISO format: YYYY-MM-DD")

        plan = StudyPlan.objects.create(user=user, title=title, start_date=start, end_date=end)

        return JsonResponse(
            {
                "id": plan.id,
                "title": plan.title,
                "start_date": plan.start_date.isoformat(),
                "end_date": plan.end_date.isoformat(),
            },
            status=201,
        )

    return HttpResponseNotAllowed(["GET", "POST"])


@login_required
@csrf_exempt
def plan_detail(request: HttpRequest, plan_id: int):
    """
    GET    /api/plans/<id>/   -> get one plan (must be owned by user)
    DELETE /api/plans/<id>/   -> delete plan (cascade deletes tasks etc.)
    """
    plan = get_object_or_404(StudyPlan, id=plan_id, user=request.user)

    if request.method == "GET":
        return JsonResponse(
            {
                "id": plan.id,
                "title": plan.title,
                "start_date": plan.start_date.isoformat(),
                "end_date": plan.end_date.isoformat(),
            }
        )

    if request.method == "DELETE":
        plan.delete()
        return JsonResponse({"deleted": True})

    return HttpResponseNotAllowed(["GET", "DELETE"])


@login_required
def plan_tasks_list(request: HttpRequest, plan_id: int):
    """
    GET /api/plans/<id>/tasks/ -> list tasks under a plan (owned by user)
    """
    plan = get_object_or_404(StudyPlan, id=plan_id, user=request.user)

    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    tasks = Task.objects.filter(plan=plan).order_by("-id")
    data = [
        {
            "id": t.id,
            "plan_id": plan.id,
            "title": t.title,
            "status": t.status,
            "deadline_date": t.deadline_date.isoformat(),
            "estimated_effort_hours": float(t.estimated_effort_hours),
        }
        for t in tasks
    ]
    return JsonResponse({"plan": {"id": plan.id, "title": plan.title}, "tasks": data})


@login_required
@csrf_exempt
def task_create(request: HttpRequest):
    """
    POST /api/tasks/
    Body:
      - plan_id
      - title
      - deadline_date (YYYY-MM-DD)
      - estimated_effort_hours (number)
      - status (optional; default "todo" if your model uses choices)
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        body = _json_body(request)
    except ValueError as e:
        return HttpResponseBadRequest(str(e))

    plan_id = body.get("plan_id")
    title = (body.get("title") or "").strip()
    deadline_date_str = body.get("deadline_date")
    est = body.get("estimated_effort_hours")
    status = (body.get("status") or "todo").strip()

    if not plan_id or not title or not deadline_date_str or est is None:
        return HttpResponseBadRequest("Missing required fields: plan_id, title, deadline_date, estimated_effort_hours")

    # Ownership check: plan must belong to current user
    plan = get_object_or_404(StudyPlan, id=plan_id, user=request.user)

    try:
        deadline = date.fromisoformat(deadline_date_str)
    except ValueError:
        return HttpResponseBadRequest("deadline_date must be ISO format: YYYY-MM-DD")

    try:
        est_val = float(est)
    except (TypeError, ValueError):
        return HttpResponseBadRequest("estimated_effort_hours must be a number")

    task = Task.objects.create(
        plan=plan,
        title=title,
        status=status,
        deadline_date=deadline,
        estimated_effort_hours=est_val,
    )

    return JsonResponse(
        {
            "id": task.id,
            "plan_id": plan.id,
            "title": task.title,
            "status": task.status,
            "deadline_date": task.deadline_date.isoformat(),
            "estimated_effort_hours": float(task.estimated_effort_hours),
        },
        status=201,
    )


@login_required
@csrf_exempt
def task_detail(request: HttpRequest, task_id: int):
    """
    GET    /api/tasks/<id>/   -> get one task (owned by user)
    DELETE /api/tasks/<id>/   -> delete task
    """
    task = get_object_or_404(Task, id=task_id, plan__user=request.user)

    if request.method == "GET":
        return JsonResponse(
            {
                "id": task.id,
                "plan_id": task.plan_id,
                "title": task.title,
                "status": task.status,
                "deadline_date": task.deadline_date.isoformat(),
                "estimated_effort_hours": float(task.estimated_effort_hours),
            }
        )

    if request.method == "DELETE":
        task.delete()
        return JsonResponse({"deleted": True})

    return HttpResponseNotAllowed(["GET", "DELETE"])


@login_required
@csrf_exempt
def task_update_status(request: HttpRequest, task_id: int):
    """
    PATCH /api/tasks/<id>/status/
    Body: { "status": "todo" | "in_progress" | "done" }
    """
    if request.method not in ["PATCH", "POST"]:
        # Some clients can't send PATCH easily; allow POST as fallback.
        return HttpResponseNotAllowed(["PATCH", "POST"])

    task = get_object_or_404(Task, id=task_id, plan__user=request.user)

    try:
        body = _json_body(request)
    except ValueError as e:
        return HttpResponseBadRequest(str(e))

    status = (body.get("status") or "").strip()
    if not status:
        return HttpResponseBadRequest("Missing field: status")

    task.status = status
    task.save(update_fields=["status"])

    return JsonResponse({"id": task.id, "status": task.status})# Create your views here.
