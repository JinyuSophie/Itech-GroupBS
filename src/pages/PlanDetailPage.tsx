/**
 * PlanDetailPage.tsx — Detail view for a single study plan (Wireframe 3b).
 *
 * Features:
 * - Editable plan title (inline text input).
 * - Displays the plan's date range.
 * - Table of tasks belonging to this plan, each with status badge and view button.
 * - "Create Task" dialog to add new tasks to this plan.
 *
 * BACKEND INTEGRATION:
 *   Replace local state with React Query:
 *     const { data: plan } = useQuery({ queryKey: ["plan", planId], queryFn: () => plansApi.get(planId) });
 *     const { data: tasks } = useQuery({ queryKey: ["tasks", planId], ... });
 *   Replace handleSave with: useMutation({ mutationFn: (title) => plansApi.update(planId, { title }) });
 *   Replace handleCreateTask with: useMutation({ mutationFn: tasksApi.create });
 *
 * MOBILE:
 *   - Table uses overflow-x-auto for horizontal scrolling on small screens.
 *   - "Effort" and "Status" columns are hidden on very small screens.
 *   - Buttons have proper touch-target sizes.
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { mockPlans, mockTasks } from "@/services/mockData";
import type { Task } from "@/types/models";
import { ArrowLeft, Plus, Save, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

// ─── Status Badge Config ───────────────────────────────────────────────────────
// Reusable mapping from TaskStatus to human-readable label + CSS class.

const statusConfig = {
  not_started: { label: "Not Started", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", className: "bg-info/10 text-info" },
  completed: { label: "Completed", className: "bg-success/10 text-success" },
};

const PlanDetailPage = () => {
  // ── Route Params ─────────────────────────────────────────────────────────────
  // planId comes from the URL: /plans/:planId
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  // Find the plan from mock data by its ID
  const plan = mockPlans.find((p) => p.plan_id === Number(planId));

  // ── Local State ──────────────────────────────────────────────────────────────
  // Tasks are filtered by plan FK, stored locally for add operations.
  const [tasks, setTasks] = useState<Task[]>(mockTasks.filter((t) => t.plan === Number(planId)));
  const [title, setTitle] = useState(plan?.title || "");   // Editable plan title
  const [open, setOpen] = useState(false);                 // Create task dialog toggle
  const [taskTitle, setTaskTitle] = useState("");           // New task title
  const [taskDue, setTaskDue] = useState("");               // New task deadline
  const [taskEffort, setTaskEffort] = useState("");         // New task estimated effort

  // ── Not Found State ──────────────────────────────────────────────────────────
  if (!plan) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Plan not found.</div>
      </AppLayout>
    );
  }

  /**
   * handleSave — Persists the edited plan title.
   * TODO: Replace with plansApi.update(plan.plan_id, { title })
   */
  const handleSave = () => {
    toast.success("Plan saved!");
  };

  /**
   * handleCreateTask — Creates a new task under this plan.
   * Validates all fields, appends to local state, and resets the form.
   *
   * TODO: Replace with tasksApi.create({ plan: plan.plan_id, title, due_date, estimated_effort_hours })
   */
  const handleCreateTask = () => {
    if (!taskTitle || !taskDue || !taskEffort) return;
    const newTask: Task = {
      task_id: Date.now(), // Temporary ID — backend assigns a real one
      plan: plan.plan_id,  // FK link to the parent plan
      title: taskTitle,
      status: "not_started", // New tasks always start as "not_started"
      due_date: taskDue,
      estimated_effort_hours: Number(taskEffort),
    };
    setTasks([...tasks, newTask]);
    setOpen(false);
    // Reset form
    setTaskTitle("");
    setTaskDue("");
    setTaskEffort("");
    toast.success("Task created! Weekly schedule updated.");
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        {/* ── Top Bar: Back + Save Buttons ── */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button variant="ghost" onClick={() => navigate("/plans")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Plans
          </Button>
          <Button onClick={handleSave} className="gap-1.5">
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>

        {/* ── Editable Plan Title + Date Range ── */}
        <div>
          {/* Inline editable title — styled to look like a heading */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-none bg-transparent p-0 font-display text-2xl font-bold text-foreground focus-visible:ring-0 h-auto"
          />
          <p className="mt-1 text-sm text-muted-foreground">
            {plan.start_date} — {plan.end_date}
          </p>
        </div>

        {/* ── Tasks Section ── */}
        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-display text-lg font-semibold text-foreground">Tasks</h2>

            {/* Create Task Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Plus className="mr-1 h-4 w-4" /> Create Task</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Task Title</Label>
                    <Input placeholder="e.g. Write report" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Deadline</Label>
                      <Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Effort (hours)</Label>
                      <Input type="number" min={1} value={taskEffort} onChange={(e) => setTaskEffort(e.target.value)} />
                    </div>
                  </div>
                  <Button onClick={handleCreateTask} className="w-full">Create Task</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* ── Tasks Table ── */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Task</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Deadline</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Effort</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => {
                      const sc = statusConfig[task.status];
                      return (
                        <tr key={task.task_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">{task.title}</td>
                          <td className="px-4 py-3 text-muted-foreground">{task.due_date}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{task.estimated_effort_hours} hrs</td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <Badge variant="secondary" className={sc.className}>{sc.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {/* Navigate to the task detail page */}
                            <Button size="icon" variant="ghost" onClick={() => navigate(`/tasks/${task.task_id}`)}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Empty state */}
                    {tasks.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No tasks yet. Create one to get started.</td></tr>
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

export default PlanDetailPage;
