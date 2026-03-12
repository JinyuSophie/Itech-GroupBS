/**
 * TaskDetailPage.tsx — Detailed view for a single task (Wireframe 4).
 *
 * ACCESSIBILITY (WCAG):
 *   - 1.4.3 Contrast: Status uses both colour badge AND text label.
 *     Progress percentage is shown as text alongside the bar.
 *   - 2.1.1 Keyboard: Status <Select> is fully keyboard navigable.
 *     All buttons have focus-visible ring styles.
 *   - 4.1.3 Status Messages: Save action triggers toast via Sonner aria-live.
 *     The progress bar has aria-label and aria-valuenow for screen readers.
 *   - Table uses <th scope="col"> for proper screen reader column association.
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


// Badge styling for each status — uses semantic colour tokens from index.css.
// Colour is always paired with a text label (1.4.3 — not colour alone).
const statusBadgeClass: Record<TaskStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-info/10 text-info",
  completed: "bg-success/10 text-success",
};

const TaskDetailPage = () => {
  // ── Route Params ─────────────────────────────────────────────────────────────
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
        <div className="flex items-center justify-center py-20 text-muted-foreground" role="status">Task not found.</div>
      </AppLayout>
    );
  }

  // ── Derived Data ─────────────────────────────────────────────────────────────
  // Look up the parent plan for "Back to Plan" navigation
  const plan = mockPlans.find((p) => p.plan_id === task.plan);

  // Filter schedule entries that belong to this task (FK: entry.task === task.task_id)
  const entries = mockScheduleEntries.filter((e) => e.task === task.task_id);

  // Get the current status option for displaying progress percentage
  const currentStatus = statusOptions.find((o) => o.value === status)!;

  // Sum all scheduled hours for the summary line
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
      <div className="animate-fade-in space-y-6 max-w-2xl  mx-auto">
        {/* ── Top Bar: Back + Save ── */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button variant="ghost" onClick={() => navigate(plan ? `/plans/${plan.plan_id}` : "/plans")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Plan
          </Button>
          <Button onClick={handleSave} className="gap-1.5" aria-label="Go back to plan">
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>

        {/* ── Task Title + Plan Name ── */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{task.title}</h1>
          {plan && <p className="text-sm text-muted-foreground mt-1">{plan.title}</p>}
        </div>

        {/* ── Progress Bar Section ── */}
        {/* Progress value driven by current status selection */}
        <Card>
          <CardContent className="pt-5 pb-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" aria-hidden="true" />
                <span className="text-sm font-medium text-foreground">Task Progress</span>
              </div>
              {/* Status badge — colour + text label (1.4.3) */}
              <Badge variant="secondary" className={statusBadgeClass[status]}>
                {currentStatus.label}
              </Badge>
            </div>
            {/* Progress bar — h-3 for visibility, value from statusOptions */}
            <Progress
              value={currentStatus.progress}
              className="h-3"
              aria-label={`Task progress: ${currentStatus.progress}% complete`}
            />
            <p className="text-xs text-muted-foreground text-right">
              {currentStatus.progress}% complete
            </p>
          </CardContent>
        </Card>

        {/* ── Info Fields: Deadline + Effort ── */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {/* Deadline */}
          <Card>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-accent" aria-hidden="true" />
              <div>
                <p className="text-xs text-muted-foreground">Deadline</p>
                <p className="text-sm font-medium text-foreground">{task.due_date}</p>
              </div>
            </CardContent>
          </Card>

          {/* Estimated Effort */}
          <Card>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-accent" aria-hidden="true" />
              <div>
                <p className="text-xs text-muted-foreground">Estimated Effort</p>
                <p className="text-sm font-medium text-foreground">{task.estimated_effort_hours} hours</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Status Selector (Wireframe 4) ── */}
        {/* Wireframe shows radio-style: Not Started / In Progress / Completed */}
        {/* Implemented as a Select dropdown for better mobile UX */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground mb-2">Status</p>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as TaskStatus)}
            >
              <SelectTrigger className="h-9 text-sm" aria-label="Change task status">
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

        {/* ── Scheduled Work Table (Wireframe 4) ── */}
        {/* Columns: Date | Hours | Note (with "rescheduled" badge) */}
        <section aria-label="Scheduled work entries">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-display text-lg font-semibold text-foreground">Scheduled Work</h2>
            {totalScheduledHours > 0 && (
              <span className="text-xs text-muted-foreground">
                {totalScheduledHours} / {task.estimated_effort_hours} hours scheduled
              </span>
            )}
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Scheduled work sessions">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Hours</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.entry_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-foreground">{entry.scheduled_date}</td>
                        <td className="px-4 py-3 text-foreground">{entry.planned_effort_hours}</td>
                        <td className="px-4 py-3">
                          {/* "Rescheduled" badge in Note column per Wireframe 4 */}
                          {entry.is_rescheduled ? (
                            <Badge variant="secondary" className="bg-warning/10 text-warning gap-1">
                              <RefreshCw className="h-3 w-3" aria-hidden="true" /> Rescheduled
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
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
