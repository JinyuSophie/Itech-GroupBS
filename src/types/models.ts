/**
 * models.ts — TypeScript interfaces matching the ER Diagram for the Django REST backend.
 *
 * These types mirror the Django models defined in the backend:
 *   - User          → accounts.models.User
 *   - StudyPlan     → plans.models.StudyPlan
 *   - Task          → tasks.models.Task
 *   - ScheduleEntry → schedule.models.ScheduleEntry
 *   - ProgressLog   → schedule.models.ProgressLog
 *
 * Foreign-key fields (e.g. `plan`, `task`, `entry`) store the related object's
 * primary-key ID as a number. The Django REST Framework serializers return these
 * as integer IDs by default; nested serializers can be used if full objects are
 * needed in a response.
 *
 * When connecting to the real backend, these interfaces should be updated if
 * the API response shape changes (e.g. nested objects instead of IDs).
 */

// ─── Core Domain Models ────────────────────────────────────────────────────────

/**
 * Represents an authenticated user.
 * Maps to Django's custom User model (PK: user_id).
 */
export interface User {
  user_id: number;
  email: string;
  created_at: string; // ISO 8601 datetime string from Django
}

/**
 * A study plan groups related tasks under a single academic goal.
 * Maps to plans.models.StudyPlan.
 *
 * `user` is a FK to User.user_id — identifies the owner of this plan.
 */
export interface StudyPlan {
  plan_id: number;
  user: number; // FK → User.user_id
  title: string;
  start_date: string; // "YYYY-MM-DD" format
  end_date: string;   // "YYYY-MM-DD" format
}

/**
 * An individual task within a study plan.
 * Maps to tasks.models.Task.
 *
 * `plan` is a FK to StudyPlan.plan_id — the parent plan.
 * `status` uses a Django CharField with choices matching TaskStatus below.
 */
export interface Task {
  task_id: number;
  plan: number; // FK → StudyPlan.plan_id
  title: string;
  status: TaskStatus;
  due_date: string; // "YYYY-MM-DD" format
  estimated_effort_hours: number; // Total hours the student expects to spend
}

/**
 * Allowed status values for a Task.
 * These correspond to the Django model's STATUS_CHOICES:
 *   - "not_started" → task has not been worked on yet
 *   - "in_progress" → task is currently being worked on
 *   - "completed"   → task is finished
 */
export type TaskStatus = "not_started" | "in_progress" | "completed";

/**
 * A single scheduled work session for a task on a specific date.
 * Maps to schedule.models.ScheduleEntry.
 *
 * `task` is a FK to Task.task_id.
 * `is_rescheduled` indicates whether this entry was moved from its original date.
 */
export interface ScheduleEntry {
  entry_id: number;
  task: number; // FK → Task.task_id
  scheduled_date: string; // "YYYY-MM-DD" — the date this work session is planned
  planned_effort_hours: number; // How many hours are allocated for this session
  is_rescheduled: boolean; // True if this entry was moved from a previous date
}

/**
 * Tracks actual progress logged against a ScheduleEntry.
 * Maps to schedule.models.ProgressLog.
 *
 * `entry` is a FK to ScheduleEntry.entry_id.
 * `completed_flag` indicates whether the student considers this session done.
 */
export interface ProgressLog {
  progress_id: number;
  entry: number; // FK → ScheduleEntry.entry_id
  actual_effort_hours: number; // Hours the student actually spent
  completed_flag: boolean; // Did the student finish the planned work?
}

// ─── API Request / Response Types ──────────────────────────────────────────────

/**
 * Request body for POST /api/auth/login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Request body for POST /api/auth/register
 * `confirm_password` is validated server-side to match `password`.
 */
export interface RegisterRequest {
  email: string;
  password: string;
  confirm_password: string;
}

/**
 * Response body returned by both login and register endpoints.
 * The `token` is a Django REST Framework Token used for subsequent
 * authenticated requests via the "Authorization: Token <token>" header.
 */
export interface AuthResponse {
  user: User;
  token: string;
}

// ─── Composite / Aggregated Types (used by Dashboard & Summary pages) ──────────

/**
 * Shape of GET /api/dashboard response.
 * The backend aggregates data from multiple models to build this.
 *
 * - progress_overview: each plan with its completion percentage
 * - todays_tasks: tasks scheduled for today, enriched with plan title and urgency
 * - upcoming_deadlines: tasks due soon, enriched with plan title
 */
export interface DashboardData {
  progress_overview: { plan: StudyPlan; progress_percent: number }[];
  todays_tasks: (Task & { plan_title: string; days_until_due: number })[];
  upcoming_deadlines: (Task & { plan_title: string })[];
}

/**
 * Shape of GET /api/summary/weekly response.
 * Provides an overview of the student's productivity for a given week.
 *
 * - tasks_completed: count of tasks marked "completed" this week
 * - total_effort_hours: sum of actual effort logged this week
 * - remaining_workload_hours: estimated hours still needed across all plans
 * - plans_progress: per-plan completion percentages
 */
export interface WeeklySummary {
  week_start: string; // "YYYY-MM-DD"
  week_end: string;   // "YYYY-MM-DD"
  tasks_completed: number;
  total_effort_hours: number;
  remaining_workload_hours: number;
  plans_progress: { plan: StudyPlan; progress_percent: number }[];
}
