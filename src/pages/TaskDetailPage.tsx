/**
 * TaskDetailPage.tsx — Detailed view for a single task (Wireframe 4).
 *
 * Features:
 * - Dynamic progress bar that updates based on the selected task status:
 *     Not Started → 0%, In Progress → 50%, Completed → 100%.
 * - Info cards showing Deadline, Estimated Effort, and a Status selector.
 * - Scheduled Work table listing all ScheduleEntries for this task.
 * - "Rescheduled" badge on entries that were moved from their original date.
 *
 * BACKEND INTEGRATION:
 *   Replace mock lookups with API calls:
 *     const { data: task } = useQuery({ queryKey: ["task", taskId], queryFn: () => tasksApi.get(taskId) });
 *   Replace handleSave with: useMutation({ mutationFn: (status) => tasksApi.update(taskId, { status }) });
 *
 * MOBILE:
 *   - Info cards stack vertically on small screens (grid-cols-1 → sm:3).
 *   - Table scrolls horizontally on narrow viewports.
 *   - Touch-friendly select dropdown and buttons.
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockTasks, mockScheduleEntries, mockPlans } from "@/services/mockData";
import type { TaskStatus } from "@/types/models";
import { ArrowLeft, Save, Clock, CalendarDays, RefreshCw, Target } from "lucide-react";
import { toast } from "sonner";

// ─── Status Options ────────────────────────────────────────────────────────────
// Each status maps to a label and a progress percentage.
// This drives both the status selector dropdown and the progress bar.

const statusOptions: { value: TaskStatus; label: string; progress: number }[] = [
  { value: "not_started", label: "Not Started", progress: 0 },
  { value: "in_progress", label: "In Progress", progress: 50 },
  { value: "completed", label: "Completed", progress: 100 },
];

// Badge styling for each status — uses semantic color tokens from index.css
const statusBadgeClass: Record<TaskStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-info/10 text-info",
  completed: "bg-success/10 text-success",
};

const TaskDetailPage = () => {
  // ── Route Params ─────────────────────────────────────────────────────────────
  // taskId comes from the URL: /tasks/:taskId
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  // Find the task from mock data
  const task = mockTasks.find((t) => t.task_id === Number(taskId));

  // ── Local State ──────────────────────────────────────────────────────────────
  // Track the selected status locally so the progress bar updates instantly
  const [status, setStatus] = useState<TaskStatus>(task?.status || "not_started");

  // ── Not Found ────────────────────────────────────────────────────────────────
  if (!task) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Task not found.</div>
      </AppLayout>
    );
  }

  // ── Derived Data ─────────────────────────────────────────────────────────────
  // Look up the parent plan for breadcrumb/back navigation
  const plan = mockPlans.find((p) => p.plan_id === task.plan);

  // Filter schedule entries that belong to this task (FK: entry.task === task.task_id)
  const entries = mockScheduleEntries.filter((e) => e.task === task.task_id);

  // Get the current status option for displaying progress percentage
  const currentStatus = statusOptions.find((o) => o.value === status)!;

  // Sum up all scheduled hours to show against the estimated effort
  const totalScheduledHours = entries.reduce((sum, e) => sum + e.planned_effort_hours, 0);

  /**
   * handleSave — Persists the updated task status.
   * TODO: Replace with tasksApi.update(task.task_id, { status })
   */
  const handleSave = () => {
    toast.success("Task status updated!");
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6 max-w-2xl">
        {/* ── Top Bar: Back + Save ── */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button variant="ghost" onClick={() => navigate(plan ? `/plans/${plan.plan_id}` : "/plans")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Plan
          </Button>
          <Button onClick={handleSave} className="gap-1.5">
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>

        {/* ── Task Title + Plan Name ── */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{task.title}</h1>
          {/* Show the parent plan name as a subtitle */}
          {plan && <p className="text-sm text-muted-foreground mt-1">{plan.title}</p>}
        </div>

        {/* ── Progress Bar Section (Wireframe 4 feature) ── */}
        {/* The progress value is driven by the current status selection */}
        <Card>
          <CardContent className="pt-5 pb-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-foreground">Task Progress</span>
              </div>
              {/* Status badge with colour coding */}
              <Badge variant="secondary" className={statusBadgeClass[status]}>
                {currentStatus.label}
              </Badge>
            </div>
            {/* Progress bar — h-3 for visibility, value from statusOptions */}
            <Progress value={currentStatus.progress} className="h-3" />
            <p className="text-xs text-muted-foreground text-right">{currentStatus.progress}% complete</p>
          </CardContent>
        </Card>

        {/* ── Info Cards: Deadline, Effort, Status Selector ── */}
        {/* Stack vertically on mobile, 3 columns on tablet+ */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {/* Deadline Card */}
          <Card>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Deadline</p>
                <p className="text-sm font-medium text-foreground">{task.due_date}</p>
              </div>
            </CardContent>
          </Card>

          {/* Estimated Effort Card */}
          <Card>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Estimated Effort</p>
                <p className="text-sm font-medium text-foreground">{task.estimated_effort_hours} hours</p>
              </div>
            </CardContent>
          </Card>

          {/* Status Selector Card */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground mb-1.5">Status</p>
              {/* Dropdown to change task status — updates progress bar instantly */}
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* ── Scheduled Work Table ── */}
        {/* Shows all ScheduleEntry records linked to this task */}
        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-display text-lg font-semibold text-foreground">Scheduled Work</h2>
            {/* Summary: total scheduled hours vs estimated effort */}
            {totalScheduledHours > 0 && (
              <span className="text-xs text-muted-foreground">
                {totalScheduledHours} / {task.estimated_effort_hours} hours scheduled
              </span>
            )}
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Hours</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.entry_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-foreground">{entry.scheduled_date}</td>
                        <td className="px-4 py-3 text-foreground">{entry.planned_effort_hours}</td>
                        <td className="px-4 py-3">
                          {/* Show "Rescheduled" badge if entry was moved from original date */}
                          {entry.is_rescheduled && (
                            <Badge variant="secondary" className="bg-warning/10 text-warning gap-1">
                              <RefreshCw className="h-3 w-3" /> Rescheduled
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* Empty state when no schedule entries exist */}
                    {entries.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No scheduled entries yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
};

export default TaskDetailPage;
