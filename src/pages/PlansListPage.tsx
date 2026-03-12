/**
 * PlansListPage.tsx — List of all study plans.
 * 
 * ACCESSIBILITY (WCAG):
 *   - 1.4.3 Contrast: Progress bars use semantic tokens. Progress percentage
 *     is shown as text alongside the bar (not colour alone).
 *   - 2.1.1 Keyboard: Cards are clickable via onClick + cursor-pointer.
 *     Delete button has aria-label describing the action.
 *   - 4.1.3 Status Messages: Delete action triggers toast via Sonner aria-live.
 *   - Cards use role="link" implicitly through onClick + keyboard handling.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { plansApi } from "@/services/api";
import type { StudyPlan, Task } from "@/types/models";
import { Plus, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

type TaskStats = { count: number; progress: number };

const PlansListPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [statsByPlan, setStatsByPlan] = useState<Record<number, TaskStats>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const loadPlans = async () => {
    setLoading(true);
    try {
      const plansData = (await plansApi.list()) as StudyPlan[];
      setPlans(plansData);

  // ── State ────────────────────────────────────────────────────────────────────
  // Local copy of plans for delete operations.
  // TODO: Replace with server state via React Query when backend is ready.
  const [plans, setPlans] = useState<StudyPlan[]>(mockPlans);

  /**
   * getProgress — Calculates completion percentage for a plan.
   * Counts completed tasks vs total tasks belonging to the plan.
   *
   * @param planId — The plan_id to calculate progress for.
   * @returns Integer percentage (0–100).
   */
  const getProgress = (planId: number) => {
    const tasks = mockTasks.filter((t) => t.plan === planId);
    if (!tasks.length) return 0;
    return Math.round((tasks.filter((t) => t.status === "completed").length / tasks.length) * 100);
  };

  /**
   * handleDelete — Removes a plan from the local list.
   * e.stopPropagation() prevents the card's onClick (navigation) from firing.
   *
   * TODO: Replace with plansApi.delete(id)
   */
  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await plansApi.delete(id);
      await loadPlans();
      toast.success("Plan deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete plan");
    }
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Study Plans</h1>
            <p className="text-sm text-muted-foreground">Manage your academic study plans</p>
          </div>
          {/* Navigate to the dedicated Create Plan page (/plans/new) per wireframe sitemap */}
          <Button onClick={() => navigate("/plans/new")} className="gap-1.5">
            <Plus className="h-4 w-4" /> Create Plan
          </Button>
        </div>

        {/* ── Plans Grid ── */}
        {/* Single column on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const progress = getProgress(plan.plan_id);
            const taskCount = mockTasks.filter((t) => t.plan === plan.plan_id).length;
            return (
              <Card
                key={plan.plan_id}
                className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => navigate(`/plans/${plan.plan_id}`)}
                tabIndex={0}
                role="link"
                aria-label={`View plan: ${plan.title}`}
                onKeyDown={(e) => {
                  // Allow keyboard activation with Enter or Space (2.1.1 Keyboard)
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/plans/${plan.plan_id}`);
                  }
                }}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <CardTitle className="text-base font-semibold">{plan.title}</CardTitle>
                  {/* Delete button — stopPropagation prevents card click */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(plan.plan_id, e)}
                    aria-label={`Delete plan: ${plan.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Date range display */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true"/>
                    {plan.start_date} → {plan.end_date}
                  </div>
                  {/* Task count */}
                  <div className="text-xs text-muted-foreground">{taskCount} task{taskCount !== 1 ? "s" : ""}</div>
                  {/* Progress bar — percentage shown as text (not colour alone, 1.4.3) */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" aria-label={`${progress}% complete`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default PlansListPage;
