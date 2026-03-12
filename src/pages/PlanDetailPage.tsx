/**
 * PlanDetailPage.tsx — Detail view for a single study plan (Wireframe 3).
 *
 * ACCESSIBILITY (WCAG):
 *   - 1.4.3 Contrast: Status badges use both colour AND text labels (not colour alone).
 *   - 2.1.1 Keyboard: All buttons and links are keyboard focusable.
 *     Table rows have View buttons for keyboard navigation to task detail.
 *   - 4.1.3 Status Messages: Toast notifications use Sonner's aria-live region.
 *   - Tables use <th> with scope for screen reader column association.
 * 
 * BACKEND INTEGRATION:
 *   Replace local state with React Query:
 *     const { data: plan } = useQuery({ queryKey: ["plan", planId], queryFn: () => plansApi.get(planId) });
 *     const { data: tasks } = useQuery({ queryKey: ["tasks", planId], queryFn: () => tasksApi.listByPlan(planId) });
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockPlans, mockTasks } from "@/services/mockData";
import type { Task } from "@/types/models";
import { ArrowLeft, Plus, Save, ChevronRight, Pencil } from "lucide-react";
import { toast } from "sonner";

// ─── Status Badge Config ───────────────────────────────────────────────────────
// Maps TaskStatus → human-readable label + CSS class.
// Uses both colour AND text to convey status (1.4.3 Contrast — not colour alone).

const statusConfig = {
  not_started: { label: "Not Started", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", className: "bg-info/10 text-info" },
  completed: { label: "Completed", className: "bg-success/10 text-success" },
};

const PlanDetailPage = () => {
  // ── Route Params ─────────────────────────────────────────────────────────────
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  // Find the plan from mock data by its numeric ID
  const plan = mockPlans.find((p) => p.plan_id === Number(planId));

  // ── Local State ──────────────────────────────────────────────────────────────
  // Tasks are filtered by plan FK, stored locally for add operations.// Tasks filtered by the plan FK — stored locally for display.  const [tasks, setTasks] = useState<Task[]>(mockTasks.filter((t) => t.plan === Number(planId)));

  // ── Not Found State ──────────────────────────────────────────────────────────
  if (!plan) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground" role="status">Plan not found.</div>
      </AppLayout>
    );
  }

  /**
   * handleSave — Persists any pending changes.
   * TODO: Replace with plansApi.update(plan.plan_id, { ... })
   */
  const handleSave = () => {
    toast.success("Plan saved!");
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        {/* ── Top Bar: Back + Save Buttons ── */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button variant="ghost" onClick={() => navigate("/plans")} className="gap-1.5" aria-label="Go back to plans list">
            <ArrowLeft className="h-4 w-4" /> Back to Plans
          </Button>
           <div className="flex items-center gap-2">
            {/* Edit button — navigates to dedicated edit page per sitemap */}
            <Button
              variant="outline"
              onClick={() => navigate(`/plans/${plan.plan_id}/edit`)}
              className="gap-1.5"
            >
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button onClick={handleSave} className="gap-1.5">
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        </div>

        {/* ── Plan Title + Date Range (read-only) ── */}
        {/* Title is read-only here; editing happens on /plans/:id/edit */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{plan.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {plan.start_date} — {plan.end_date}
          </p>
        </div>

        {/* ── Tasks Section ── */}
        <section aria-label="Plan tasks">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-display text-lg font-semibold text-foreground">Tasks</h2>
                        {/* Navigate to dedicated Create Task page per wireframe sitemap */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/tasks/new?plan=${plan.plan_id}`)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" /> Create Task
            </Button>
          </div>

          {/* ── Tasks Table ── */}
          {/* Columns: Task | Deadline | Effort | Status | View */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Tasks list">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Task</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Deadline</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Effort</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium text-muted-foreground">View</th>
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
                            {/* Status badge — uses colour + text label (1.4.3) */}
                            <Badge variant="secondary" className={sc.className}>{sc.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button size="icon" variant="ghost" onClick={() => navigate(`/tasks/${task.task_id}`)} aria-label={`View task: ${task.title}`}>
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
          {/* ── System Message Area ── */}
          {/* Wireframe 3 shows "(System message: Weekly schedule updated)" */}
          {/* This is handled by Sonner toast with aria-live (4.1.3) */}
        </section>
      </div>
    </AppLayout>
  );
};

export default PlanDetailPage;
