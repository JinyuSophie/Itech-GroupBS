/**
 * mockData.ts — Static mock data used to develop and preview the UI
 * before the Django REST backend is ready.
 *
 * HOW TO REPLACE:
 * Each page currently imports from this file. When the backend is ready,
 * replace the imports with API calls from src/services/api.ts.
 * For example, in DashboardPage.tsx:
 *   BEFORE: const data = mockDashboard;
 *   AFTER:  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.get });
 *
 * The data shapes here exactly match the TypeScript interfaces in src/types/models.ts,
 * which in turn match the Django serializer output.
 */

import type { StudyPlan, Task, ScheduleEntry, DashboardData, WeeklySummary } from "@/types/models";

// ─── Study Plans ───────────────────────────────────────────────────────────────
// Three sample plans. `user: 1` is the FK to the mock logged-in user.

export const mockPlans: StudyPlan[] = [
  { plan_id: 1, user: 1, title: "Internet Technology Coursework", start_date: "2026-02-01", end_date: "2026-03-15" },
  { plan_id: 2, user: 1, title: "Algorithms & Data Structures", start_date: "2026-02-10", end_date: "2026-04-01" },
  { plan_id: 3, user: 1, title: "Software Engineering Project", start_date: "2026-01-20", end_date: "2026-03-30" },
];

// ─── Tasks ─────────────────────────────────────────────────────────────────────
// Tasks are linked to plans via the `plan` FK (plan_id).
// Each task has a status that drives the progress bar on the Task Detail page.

export const mockTasks: Task[] = [
  { task_id: 1, plan: 1, title: "Design Specification Document", status: "completed", due_date: "2026-02-12", estimated_effort_hours: 8 },
  { task_id: 2, plan: 1, title: "Frontend Implementation", status: "in_progress", due_date: "2026-03-01", estimated_effort_hours: 20 },
  { task_id: 3, plan: 1, title: "Backend API Development", status: "not_started", due_date: "2026-03-10", estimated_effort_hours: 15 },
  { task_id: 4, plan: 2, title: "Graph Algorithms Assignment", status: "in_progress", due_date: "2026-02-28", estimated_effort_hours: 10 },
  { task_id: 5, plan: 2, title: "Dynamic Programming Lab", status: "not_started", due_date: "2026-03-15", estimated_effort_hours: 6 },
  { task_id: 6, plan: 3, title: "Requirements Gathering", status: "completed", due_date: "2026-02-05", estimated_effort_hours: 4 },
  { task_id: 7, plan: 3, title: "Sprint 1 Development", status: "in_progress", due_date: "2026-03-01", estimated_effort_hours: 25 },
];

// ─── Schedule Entries ──────────────────────────────────────────────────────────
// Each entry represents a work session on a specific date for a task.
// `is_rescheduled: true` means the backend moved this from an earlier date.

export const mockScheduleEntries: ScheduleEntry[] = [
  { entry_id: 1, task: 2, scheduled_date: "2026-02-28", planned_effort_hours: 3, is_rescheduled: false },
  { entry_id: 2, task: 4, scheduled_date: "2026-02-28", planned_effort_hours: 2, is_rescheduled: false },
  { entry_id: 3, task: 7, scheduled_date: "2026-02-28", planned_effort_hours: 4, is_rescheduled: false },
  { entry_id: 4, task: 2, scheduled_date: "2026-03-01", planned_effort_hours: 3, is_rescheduled: false },
  { entry_id: 5, task: 3, scheduled_date: "2026-03-02", planned_effort_hours: 2, is_rescheduled: true },
  { entry_id: 6, task: 5, scheduled_date: "2026-03-03", planned_effort_hours: 3, is_rescheduled: false },
  { entry_id: 7, task: 4, scheduled_date: "2026-03-01", planned_effort_hours: 2, is_rescheduled: false },
];

// ─── Dashboard Data ────────────────────────────────────────────────────────────
// Pre-aggregated data that the GET /api/dashboard endpoint would return.
// `days_until_due` is computed server-side relative to today's date.

export const mockDashboard: DashboardData = {
  progress_overview: [
    { plan: mockPlans[0], progress_percent: 60 },
    { plan: mockPlans[1], progress_percent: 20 },
    { plan: mockPlans[2], progress_percent: 45 },
  ],
  todays_tasks: [
    { ...mockTasks[1], plan_title: "Internet Technology Coursework", days_until_due: 1 },
    { ...mockTasks[3], plan_title: "Algorithms & Data Structures", days_until_due: 0 },
    { ...mockTasks[6], plan_title: "Software Engineering Project", days_until_due: 1 },
  ],
  upcoming_deadlines: [
    { ...mockTasks[2], plan_title: "Internet Technology Coursework" },
    { ...mockTasks[4], plan_title: "Algorithms & Data Structures" },
  ],
};

// ─── Weekly Summary ────────────────────────────────────────────────────────────
// Pre-aggregated data that the GET /api/summary/weekly endpoint would return.

export const mockWeeklySummary: WeeklySummary = {
  week_start: "2026-02-23",
  week_end: "2026-03-01",
  tasks_completed: 2,
  total_effort_hours: 14,
  remaining_workload_hours: 52,
  plans_progress: [
    { plan: mockPlans[0], progress_percent: 60 },
    { plan: mockPlans[1], progress_percent: 20 },
    { plan: mockPlans[2], progress_percent: 45 },
  ],
};
