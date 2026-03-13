import json
from datetime import date
from functools import wraps

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.http import HttpRequest, HttpResponseBadRequest, HttpResponseNotAllowed, JsonResponse
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt

from .models import ProgressLog, ScheduleEntry, StudyPlan, Task


User = get_user_model()


def _json_body(request: HttpRequest) -> dict:
    """Safely parse JSON body. Return {} if empty."""
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON")


def _serialize_user(user) -> dict:
    return {
        "user_id": user.id,
        "email": user.email,
        "created_at": user.date_joined.isoformat(),
    }


def _serialize_plan(plan: StudyPlan) -> dict:
    return {
        "plan_id": plan.id,
        "user": plan.user_id,
        "title": plan.title,
        "start_date": plan.start_date.isoformat(),
        "end_date": plan.end_date.isoformat(),
    }


def _serialize_task(task: Task) -> dict:
    return {
        "task_id": task.id,
        "plan": task.plan_id,
        "title": task.title,
        "status": task.status,
        "due_date": task.deadline_date.isoformat(),
        "estimated_effort_hours": float(task.estimated_effort_hours),
    }


def _serialize_schedule_entry(entry: ScheduleEntry) -> dict:
    return {
        "entry_id": entry.id,
        "task": entry.task_id,
        "scheduled_date": entry.scheduled_date.isoformat(),
        "planned_effort_hours": float(entry.planned_effort_hours),
        "is_rescheduled": bool(entry.is_rescheduled),
    }


def _serialize_progress_log(progress_log: ProgressLog) -> dict:
    return {
        "progress_id": progress_log.id,
        "entry": progress_log.schedule_entry_id,
        "actual_effort_hours": float(progress_log.actual_effort_hours),
        "completed_flag": bool(progress_log.completed_flag),
    }


def api_login_required(view_func):
    """Return JSON 401 instead of redirecting to HTML login page."""

    @wraps(view_func)
    def _wrapped(request: HttpRequest, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({"detail": "Authentication required"}, status=401)
        return view_func(request, *args, **kwargs)

    return _wrapped


def health(request: HttpRequest):
    return JsonResponse({"status": "ok"})


@csrf_exempt
def auth_register(request: HttpRequest):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        body = _json_body(request)
    except ValueError as e:
        return HttpResponseBadRequest(str(e))

    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    confirm_password = body.get("confirm_password") or ""

    if not email or not password or not confirm_password:
        return HttpResponseBadRequest("Missing required fields: email, password, confirm_password")

    if password != confirm_password:
        return HttpResponseBadRequest("Passwords do not match")

    if User.objects.filter(email=email).exists():
        return HttpResponseBadRequest("Email already registered")

    # The default Django user model requires username, so we use email as username.
    user = User.objects.create_user(username=email, email=email, password=password)
    login(request, user)

    return JsonResponse({"user": _serialize_user(user)}, status=201)


@csrf_exempt
def auth_login(request: HttpRequest):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        body = _json_body(request)
    except ValueError as e:
        return HttpResponseBadRequest(str(e))

    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not email or not password:
        return HttpResponseBadRequest("Missing required fields: email, password")

    user = authenticate(request, username=email, password=password)
    if user is None:
        return JsonResponse({"detail": "Invalid credentials"}, status=401)

    login(request, user)
    return JsonResponse({"user": _serialize_user(user)})


@csrf_exempt
@api_login_required
def auth_logout(request: HttpRequest):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    logout(request)
    return JsonResponse({"logged_out": True})


@api_login_required
def auth_session(request: HttpRequest):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    return JsonResponse({"user": _serialize_user(request.user)})


@api_login_required
@csrf_exempt
def plans_list_create(request: HttpRequest):
    """
    GET  /api/plans/        -> list current user's plans
    POST /api/plans/        -> create a new plan (title, start_date, end_date)
    """
    user = request.user

    if request.method == "GET":
        plans = StudyPlan.objects.filter(user=user).order_by("-id")
        return JsonResponse({"plans": [_serialize_plan(p) for p in plans]})

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

        try:
            start = date.fromisoformat(start_date_str)
            end = date.fromisoformat(end_date_str)
        except ValueError:
            return HttpResponseBadRequest("Dates must be ISO format: YYYY-MM-DD")

        if end < start:
            return HttpResponseBadRequest("end_date must be on or after start_date")

        plan = StudyPlan.objects.create(user=user, title=title, start_date=start, end_date=end)
        return JsonResponse(_serialize_plan(plan), status=201)

    return HttpResponseNotAllowed(["GET", "POST"])


@api_login_required
@csrf_exempt
def plan_detail(request: HttpRequest, plan_id: int):
    """
    GET    /api/plans/<id>/   -> get one plan (must be owned by user)
    PUT    /api/plans/<id>/   -> update plan fields
    DELETE /api/plans/<id>/   -> delete plan (cascade deletes tasks etc.)
    """
    plan = get_object_or_404(StudyPlan, id=plan_id, user=request.user)

    if request.method == "GET":
        return JsonResponse(_serialize_plan(plan))

    if request.method == "PUT":
        try:
            body = _json_body(request)
        except ValueError as e:
            return HttpResponseBadRequest(str(e))

        update_fields = []

        if "title" in body:
            title = (body.get("title") or "").strip()
            if not title:
                return HttpResponseBadRequest("title cannot be empty")
            plan.title = title
            update_fields.append("title")

        if "start_date" in body:
            try:
                plan.start_date = date.fromisoformat(body.get("start_date"))
            except (TypeError, ValueError):
                return HttpResponseBadRequest("start_date must be ISO format: YYYY-MM-DD")
            update_fields.append("start_date")

        if "end_date" in body:
            try:
                plan.end_date = date.fromisoformat(body.get("end_date"))
            except (TypeError, ValueError):
                return HttpResponseBadRequest("end_date must be ISO format: YYYY-MM-DD")
            update_fields.append("end_date")

        if plan.end_date < plan.start_date:
            return HttpResponseBadRequest("end_date must be on or after start_date")

        if update_fields:
            plan.save(update_fields=update_fields)

        return JsonResponse(_serialize_plan(plan))

    if request.method == "DELETE":
        plan.delete()
        return JsonResponse({"deleted": True})

    return HttpResponseNotAllowed(["GET", "PUT", "DELETE"])


@api_login_required
def plan_tasks_list(request: HttpRequest, plan_id: int):
    """
    GET /api/plans/<id>/tasks/ -> list tasks under a plan (owned by user)
    """
    plan = get_object_or_404(StudyPlan, id=plan_id, user=request.user)

    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    tasks = Task.objects.filter(plan=plan).order_by("-id")
    return JsonResponse({"plan": _serialize_plan(plan), "tasks": [_serialize_task(t) for t in tasks]})


@api_login_required
@csrf_exempt
def task_create(request: HttpRequest):
    """
    POST /api/tasks/
    Body:
      - plan_id
      - title
      - deadline_date (YYYY-MM-DD)
      - estimated_effort_hours (number)
      - status (optional)
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
    status = (body.get("status") or Task.STATUS_NOT_STARTED).strip()

    if not plan_id or not title or not deadline_date_str or est is None:
        return HttpResponseBadRequest("Missing required fields: plan_id, title, deadline_date, estimated_effort_hours")

    if status not in {choice[0] for choice in Task.STATUS_CHOICES}:
        return HttpResponseBadRequest("Invalid status")

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

    # Create a default schedule entry so weekly schedule has data immediately.
    ScheduleEntry.objects.create(
        task=task,
        scheduled_date=date.today(),
        planned_effort_hours=est_val,
        is_rescheduled=False,
    )

    return JsonResponse(_serialize_task(task), status=201)


@api_login_required
@csrf_exempt
def task_detail(request: HttpRequest, task_id: int):
    """
    GET    /api/tasks/<id>/   -> get one task (owned by user)
    PUT    /api/tasks/<id>/   -> update editable task fields
    DELETE /api/tasks/<id>/   -> delete task
    """
    task = get_object_or_404(Task, id=task_id, plan__user=request.user)

    if request.method == "GET":
        return JsonResponse(_serialize_task(task))

    if request.method == "PUT":
        try:
            body = _json_body(request)
        except ValueError as e:
            return HttpResponseBadRequest(str(e))

        update_fields = []

        if "title" in body:
            title = (body.get("title") or "").strip()
            if not title:
                return HttpResponseBadRequest("title cannot be empty")
            task.title = title
            update_fields.append("title")

        if "status" in body:
            status = (body.get("status") or "").strip()
            if status not in {choice[0] for choice in Task.STATUS_CHOICES}:
                return HttpResponseBadRequest("Invalid status")
            task.status = status
            update_fields.append("status")

        if "due_date" in body:
            try:
                task.deadline_date = date.fromisoformat(body.get("due_date"))
            except (TypeError, ValueError):
                return HttpResponseBadRequest("due_date must be ISO format: YYYY-MM-DD")
            update_fields.append("deadline_date")

        if "estimated_effort_hours" in body:
            try:
                task.estimated_effort_hours = float(body.get("estimated_effort_hours"))
            except (TypeError, ValueError):
                return HttpResponseBadRequest("estimated_effort_hours must be a number")
            update_fields.append("estimated_effort_hours")

        if update_fields:
            task.save(update_fields=update_fields)

        return JsonResponse(_serialize_task(task))

    if request.method == "DELETE":
        task.delete()
        return JsonResponse({"deleted": True})

    return HttpResponseNotAllowed(["GET", "PUT", "DELETE"])


@api_login_required
@csrf_exempt
def task_update_status(request: HttpRequest, task_id: int):
    """
    PATCH /api/tasks/<id>/status/
    Body: { "status": "not_started" | "in_progress" | "completed" }
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

    if status not in {choice[0] for choice in Task.STATUS_CHOICES}:
        return HttpResponseBadRequest("Invalid status")

    task.status = status
    task.save(update_fields=["status"])

    return JsonResponse({"task_id": task.id, "status": task.status})


@api_login_required
@csrf_exempt
def task_schedule_entries(request: HttpRequest, task_id: int):
    """
    GET  /api/tasks/<id>/schedule-entries/ -> list schedule entries for a task
    POST /api/tasks/<id>/schedule-entries/ -> create schedule entry for a task
    """
    task = get_object_or_404(Task, id=task_id, plan__user=request.user)

    if request.method == "GET":
        entries = ScheduleEntry.objects.filter(task=task).order_by("scheduled_date", "id")
        return JsonResponse(
            {"task": _serialize_task(task), "schedule_entries": [_serialize_schedule_entry(entry) for entry in entries]}
        )

    if request.method == "POST":
        try:
            body = _json_body(request)
        except ValueError as e:
            return HttpResponseBadRequest(str(e))

        scheduled_date = body.get("scheduled_date")
        planned_effort_hours = body.get("planned_effort_hours")
        is_rescheduled = body.get("is_rescheduled", False)

        if not scheduled_date or planned_effort_hours is None:
            return HttpResponseBadRequest("Missing required fields: scheduled_date, planned_effort_hours")

        try:
            scheduled_date_val = date.fromisoformat(scheduled_date)
        except (TypeError, ValueError):
            return HttpResponseBadRequest("scheduled_date must be ISO format: YYYY-MM-DD")

        try:
            planned_effort_val = float(planned_effort_hours)
        except (TypeError, ValueError):
            return HttpResponseBadRequest("planned_effort_hours must be a number")

        entry = ScheduleEntry.objects.create(
            task=task,
            scheduled_date=scheduled_date_val,
            planned_effort_hours=planned_effort_val,
            is_rescheduled=bool(is_rescheduled),
        )
        return JsonResponse(_serialize_schedule_entry(entry), status=201)

    return HttpResponseNotAllowed(["GET", "POST"])


@api_login_required
@csrf_exempt
def schedule_entry_detail(request: HttpRequest, entry_id: int):
    """
    GET    /api/schedule-entries/<id>/ -> get schedule entry
    PUT    /api/schedule-entries/<id>/ -> update schedule entry
    DELETE /api/schedule-entries/<id>/ -> delete schedule entry
    """
    entry = get_object_or_404(ScheduleEntry, id=entry_id, task__plan__user=request.user)

    if request.method == "GET":
        return JsonResponse(_serialize_schedule_entry(entry))

    if request.method == "PUT":
        try:
            body = _json_body(request)
        except ValueError as e:
            return HttpResponseBadRequest(str(e))

        update_fields = []

        if "scheduled_date" in body:
            try:
                entry.scheduled_date = date.fromisoformat(body.get("scheduled_date"))
            except (TypeError, ValueError):
                return HttpResponseBadRequest("scheduled_date must be ISO format: YYYY-MM-DD")
            update_fields.append("scheduled_date")

        if "planned_effort_hours" in body:
            try:
                entry.planned_effort_hours = float(body.get("planned_effort_hours"))
            except (TypeError, ValueError):
                return HttpResponseBadRequest("planned_effort_hours must be a number")
            update_fields.append("planned_effort_hours")

        if "is_rescheduled" in body:
            entry.is_rescheduled = bool(body.get("is_rescheduled"))
            update_fields.append("is_rescheduled")

        if update_fields:
            entry.save(update_fields=update_fields)

        return JsonResponse(_serialize_schedule_entry(entry))

    if request.method == "DELETE":
        entry.delete()
        return JsonResponse({"deleted": True})

    return HttpResponseNotAllowed(["GET", "PUT", "DELETE"])


@api_login_required
@csrf_exempt
def schedule_entry_progress_logs(request: HttpRequest, entry_id: int):
    """
    GET  /api/schedule-entries/<id>/progress-logs/ -> list progress logs for a schedule entry
    POST /api/schedule-entries/<id>/progress-logs/ -> create progress log
    """
    entry = get_object_or_404(ScheduleEntry, id=entry_id, task__plan__user=request.user)

    if request.method == "GET":
        progress_logs = ProgressLog.objects.filter(schedule_entry=entry).order_by("id")
        return JsonResponse(
            {
                "schedule_entry": _serialize_schedule_entry(entry),
                "progress_logs": [_serialize_progress_log(progress_log) for progress_log in progress_logs],
            }
        )

    if request.method == "POST":
        try:
            body = _json_body(request)
        except ValueError as e:
            return HttpResponseBadRequest(str(e))

        actual_effort_hours = body.get("actual_effort_hours")
        completed_flag = body.get("completed_flag", False)

        if actual_effort_hours is None:
            return HttpResponseBadRequest("Missing required field: actual_effort_hours")

        try:
            actual_effort_val = float(actual_effort_hours)
        except (TypeError, ValueError):
            return HttpResponseBadRequest("actual_effort_hours must be a number")

        progress_log = ProgressLog.objects.create(
            schedule_entry=entry,
            actual_effort_hours=actual_effort_val,
            completed_flag=bool(completed_flag),
        )
        return JsonResponse(_serialize_progress_log(progress_log), status=201)

    return HttpResponseNotAllowed(["GET", "POST"])


@api_login_required
@csrf_exempt
def progress_log_detail(request: HttpRequest, log_id: int):
    """
    GET    /api/progress-logs/<id>/ -> get progress log
    PUT    /api/progress-logs/<id>/ -> update progress log
    DELETE /api/progress-logs/<id>/ -> delete progress log
    """
    progress_log = get_object_or_404(ProgressLog, id=log_id, schedule_entry__task__plan__user=request.user)

    if request.method == "GET":
        return JsonResponse(_serialize_progress_log(progress_log))

    if request.method == "PUT":
        try:
            body = _json_body(request)
        except ValueError as e:
            return HttpResponseBadRequest(str(e))

        update_fields = []

        if "actual_effort_hours" in body:
            try:
                progress_log.actual_effort_hours = float(body.get("actual_effort_hours"))
            except (TypeError, ValueError):
                return HttpResponseBadRequest("actual_effort_hours must be a number")
            update_fields.append("actual_effort_hours")

        if "completed_flag" in body:
            progress_log.completed_flag = bool(body.get("completed_flag"))
            update_fields.append("completed_flag")

        if update_fields:
            progress_log.save(update_fields=update_fields)

        return JsonResponse(_serialize_progress_log(progress_log))

    if request.method == "DELETE":
        progress_log.delete()
        return JsonResponse({"deleted": True})

    return HttpResponseNotAllowed(["GET", "PUT", "DELETE"])


@api_login_required
def dashboard(request: HttpRequest):
    """
    GET /api/dashboard -> aggregate overview for dashboard widgets.
    """
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    today = date.today()
    plans = list(StudyPlan.objects.filter(user=request.user).order_by("-id"))

    progress_overview = []
    for plan in plans:
        plan_tasks = list(Task.objects.filter(plan=plan))
        total = len(plan_tasks)
        completed = sum(1 for t in plan_tasks if t.status == Task.STATUS_COMPLETED)
        progress_percent = int(round((completed / total) * 100)) if total else 0
        progress_overview.append({"plan": _serialize_plan(plan), "progress_percent": progress_percent})

    todays_tasks_qs = (
        Task.objects.filter(plan__user=request.user)
        .filter(Q(deadline_date=today) | Q(scheduleentry__scheduled_date=today))
        .select_related("plan")
        .order_by("deadline_date", "id")
        .distinct()
    )
    todays_tasks = []
    for task in todays_tasks_qs:
        item = _serialize_task(task)
        item["plan_title"] = task.plan.title
        item["days_until_due"] = 0
        todays_tasks.append(item)

    upcoming_qs = Task.objects.filter(plan__user=request.user).select_related("plan").order_by("deadline_date", "id")[:10]
    upcoming_deadlines = []
    for task in upcoming_qs:
        item = _serialize_task(task)
        item["plan_title"] = task.plan.title
        upcoming_deadlines.append(item)

    return JsonResponse(
        {
            "progress_overview": progress_overview,
            "todays_tasks": todays_tasks,
            "upcoming_deadlines": upcoming_deadlines,
        }
    )
