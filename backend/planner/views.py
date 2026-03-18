import json
from datetime import date, timedelta
from functools import wraps

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.db.models import Sum
from django.http import HttpRequest, HttpResponseBadRequest, HttpResponseNotAllowed, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt

from .models import ProgressLog, ScheduleEntry, StudyPlan, Task


User = get_user_model()


def _json_body(request: HttpRequest) -> dict:
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


def _start_of_week(day: date) -> date:
    return day - timedelta(days=day.weekday())


def _daterange(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def _round_hours(value: float) -> float:
    return round(float(value or 0), 2)


def _generate_initial_schedule(task: Task):
    # The initial allocation spreads estimated hours across the available study window so
    # a newly created task produces actionable schedule data immediately.
    if ScheduleEntry.objects.filter(task=task).exists() or task.estimated_effort_hours <= 0:
        return []

    today = date.today()
    start = max(today, task.plan.start_date)
    end = task.deadline_date if task.deadline_date >= start else start
    dates = list(_daterange(start, end)) or [start]
    total = _round_hours(task.estimated_effort_hours)
    base = round(total / len(dates), 2)
    entries = []
    remaining = total

    for index, scheduled_day in enumerate(dates):
        hours = base if index < len(dates) - 1 else round(remaining, 2)
        remaining = round(remaining - hours, 2)
        if hours <= 0:
            continue
        entries.append(
            ScheduleEntry.objects.create(
                task=task,
                scheduled_date=scheduled_day,
                planned_effort_hours=hours,
                is_rescheduled=False,
            )
        )
    return entries


def _next_available_date(task: Task, start_day: date) -> date:
    used = set(ScheduleEntry.objects.filter(task=task, scheduled_date__gte=start_day).values_list("scheduled_date", flat=True))
    current = start_day
    while current in used:
        current += timedelta(days=1)
    return current


def _reschedule_task_unfinished(task: Task):
    # Rescheduling only carries forward unfinished effort, which keeps historical entries intact
    # while still supporting a realistic weekly workload view.
    if task.status == Task.STATUS_COMPLETED:
        return []

    today = date.today()
    created = []
    unfinished_entries = ScheduleEntry.objects.filter(task=task, scheduled_date__lte=today, is_rescheduled=False).order_by("scheduled_date", "id")

    for entry in unfinished_entries:
        progress = ProgressLog.objects.filter(schedule_entry=entry).aggregate(total=Sum("actual_effort_hours"), completed=Sum("completed_flag"))
        actual = float(progress["total"] or 0)
        completed_any = bool(progress["completed"])
        remaining = round(max(float(entry.planned_effort_hours) - actual, 0), 2)
        if remaining <= 0 or completed_any:
            continue

        target_day = _next_available_date(task, max(today + timedelta(days=1), entry.scheduled_date + timedelta(days=1)))
        entry.is_rescheduled = True
        entry.save(update_fields=["is_rescheduled"])
        created.append(
            ScheduleEntry.objects.create(
                task=task,
                scheduled_date=target_day,
                planned_effort_hours=remaining,
                is_rescheduled=True,
            )
        )
    return created


def _serialize_schedule_entry_rich(entry: ScheduleEntry) -> dict:
    payload = _serialize_schedule_entry(entry)
    payload["task_title"] = entry.task.title
    payload["plan_id"] = entry.task.plan_id
    payload["plan_title"] = entry.task.plan.title
    payload["task_status"] = entry.task.status
    return payload


def api_login_required(view_func):
    @wraps(view_func)
    def _wrapped(request: HttpRequest, *args, **kwargs):
        # API endpoints return JSON 401 responses so the React client can handle access control
        # consistently without server-rendered redirects.
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
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    plan = get_object_or_404(StudyPlan, id=plan_id, user=request.user)
    tasks = Task.objects.filter(plan=plan).order_by("deadline_date", "id")
    return JsonResponse({"plan": _serialize_plan(plan), "tasks": [_serialize_task(t) for t in tasks]})


@api_login_required
@csrf_exempt
def task_create(request: HttpRequest):
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

    task = Task.objects.create(plan=plan, title=title, status=status, deadline_date=deadline, estimated_effort_hours=est_val)
    generated = _generate_initial_schedule(task)
    payload = _serialize_task(task)
    payload["generated_schedule_entries"] = [_serialize_schedule_entry(entry) for entry in generated]
    return JsonResponse(payload, status=201)


@api_login_required
@csrf_exempt
def task_detail(request: HttpRequest, task_id: int):
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
            if not ScheduleEntry.objects.filter(task=task).exists():
                _generate_initial_schedule(task)
        return JsonResponse(_serialize_task(task))

    if request.method == "DELETE":
        task.delete()
        return JsonResponse({"deleted": True})

    return HttpResponseNotAllowed(["GET", "PUT", "DELETE"])


@api_login_required
@csrf_exempt
def task_update_status(request: HttpRequest, task_id: int):
    if request.method not in ["PATCH", "POST"]:
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
    task = get_object_or_404(Task, id=task_id, plan__user=request.user)
    if request.method == "GET":
        entries = ScheduleEntry.objects.filter(task=task).order_by("scheduled_date", "id")
        return JsonResponse({"task": _serialize_task(task), "schedule_entries": [_serialize_schedule_entry(e) for e in entries]})
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
        entry = ScheduleEntry.objects.create(task=task, scheduled_date=scheduled_date_val, planned_effort_hours=planned_effort_val, is_rescheduled=bool(is_rescheduled))
        return JsonResponse(_serialize_schedule_entry(entry), status=201)
    return HttpResponseNotAllowed(["GET", "POST"])


@api_login_required
@csrf_exempt
def task_auto_reschedule(request: HttpRequest, task_id: int):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    task = get_object_or_404(Task, id=task_id, plan__user=request.user)
    created = _reschedule_task_unfinished(task)
    return JsonResponse({
        "task": _serialize_task(task),
        "rescheduled_entries": [_serialize_schedule_entry(entry) for entry in created],
        "created_count": len(created),
    })


@api_login_required
def schedule_weekly(request: HttpRequest):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    start_str = request.GET.get("start")
    try:
        week_start = date.fromisoformat(start_str) if start_str else _start_of_week(date.today())
    except ValueError:
        return HttpResponseBadRequest("start must be ISO format: YYYY-MM-DD")
    week_end = week_start + timedelta(days=6)

    entries = list(
        ScheduleEntry.objects.filter(
            task__plan__user=request.user,
            task__status__in=[Task.STATUS_NOT_STARTED, Task.STATUS_IN_PROGRESS],
            scheduled_date__gte=week_start,
            scheduled_date__lte=week_end,
        )
        .select_related("task__plan")
        .order_by("scheduled_date", "id")
    )
    grouped = {}
    for entry in entries:
        grouped.setdefault(entry.scheduled_date, []).append(entry)

    days = []
    for day in _daterange(week_start, week_end):
        day_entries = grouped.get(day, [])
        days.append({
            "date": day.isoformat(),
            "entries": [_serialize_schedule_entry_rich(entry) for entry in day_entries],
            "total_hours": _round_hours(sum(float(entry.planned_effort_hours) for entry in day_entries)),
        })

    return JsonResponse({
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "days": days,
    })


@api_login_required
def summary_weekly(request: HttpRequest):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    start_str = request.GET.get("start")
    try:
        week_start = date.fromisoformat(start_str) if start_str else _start_of_week(date.today())
    except ValueError:
        return HttpResponseBadRequest("start must be ISO format: YYYY-MM-DD")
    week_end = week_start + timedelta(days=6)

    progress_logs = ProgressLog.objects.filter(
        schedule_entry__task__plan__user=request.user,
        schedule_entry__task__status__in=[Task.STATUS_NOT_STARTED, Task.STATUS_IN_PROGRESS],
        schedule_entry__scheduled_date__gte=week_start,
        schedule_entry__scheduled_date__lte=week_end,
    )
    total_effort_hours = _round_hours(progress_logs.aggregate(total=Sum("actual_effort_hours"))["total"] or 0)
    tasks_completed = Task.objects.filter(plan__user=request.user, status=Task.STATUS_COMPLETED).count()

    plans = list(StudyPlan.objects.filter(user=request.user).order_by("-id"))
    plans_progress = []
    remaining_workload_hours = 0.0
    for plan in plans:
        plan_tasks = list(Task.objects.filter(plan=plan))
        total = len(plan_tasks)
        completed = sum(1 for t in plan_tasks if t.status == Task.STATUS_COMPLETED)
        progress_percent = int(round((completed / total) * 100)) if total else 0
        plans_progress.append({"plan": _serialize_plan(plan), "progress_percent": progress_percent})
        for task in plan_tasks:
            if task.status == Task.STATUS_COMPLETED:
                continue
            actual = ProgressLog.objects.filter(schedule_entry__task=task).aggregate(total=Sum("actual_effort_hours"))["total"] or 0
            remaining_workload_hours += max(float(task.estimated_effort_hours) - float(actual), 0)

    return JsonResponse({
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "tasks_completed": tasks_completed,
        "total_effort_hours": _round_hours(total_effort_hours),
        "remaining_workload_hours": _round_hours(remaining_workload_hours),
        "plans_progress": plans_progress,
    })


@api_login_required
@csrf_exempt
def schedule_auto_reschedule(request: HttpRequest):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    created = []
    tasks = Task.objects.filter(plan__user=request.user).select_related("plan")
    for task in tasks:
        created.extend(_reschedule_task_unfinished(task))
    return JsonResponse({
        "created_count": len(created),
        "rescheduled_entries": [_serialize_schedule_entry_rich(entry) for entry in created],
    })


@api_login_required
@csrf_exempt
def schedule_entry_detail(request: HttpRequest, entry_id: int):
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
    entry = get_object_or_404(ScheduleEntry, id=entry_id, task__plan__user=request.user)
    if request.method == "GET":
        logs = ProgressLog.objects.filter(schedule_entry=entry).order_by("id")
        return JsonResponse({"schedule_entry": _serialize_schedule_entry(entry), "progress_logs": [_serialize_progress_log(log) for log in logs]})
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
        progress_log = ProgressLog.objects.create(schedule_entry=entry, actual_effort_hours=actual_effort_val, completed_flag=bool(completed_flag))
        return JsonResponse(_serialize_progress_log(progress_log), status=201)
    return HttpResponseNotAllowed(["GET", "POST"])


@api_login_required
@csrf_exempt
def progress_log_detail(request: HttpRequest, log_id: int):
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

    todays_entries = list(
        ScheduleEntry.objects.filter(task__plan__user=request.user, scheduled_date=today).select_related("task__plan").order_by("id")
    )
    todays_tasks = []
    for entry in todays_entries:
        item = _serialize_task(entry.task)
        item["plan_title"] = entry.task.plan.title
        item["days_until_due"] = max((entry.task.deadline_date - today).days, 0)
        item["scheduled_hours"] = float(entry.planned_effort_hours)
        todays_tasks.append(item)

    upcoming_qs = Task.objects.filter(plan__user=request.user, deadline_date__gte=today).select_related("plan").order_by("deadline_date", "id")[:10]
    upcoming_deadlines = []
    for task in upcoming_qs:
        item = _serialize_task(task)
        item["plan_title"] = task.plan.title
        upcoming_deadlines.append(item)

    return JsonResponse({"progress_overview": progress_overview, "todays_tasks": todays_tasks, "upcoming_deadlines": upcoming_deadlines})
