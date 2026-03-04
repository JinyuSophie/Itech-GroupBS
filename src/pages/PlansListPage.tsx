/**
 * PlansListPage.tsx — List of all study plans (Wireframe 3).
 *
 * Features:
 * - Displays all plans as cards with title, date range, task count, and progress bar.
 * - "Create Plan" button opens a dialog to add a new plan.
 * - Each card is clickable, navigating to the Plan Detail page.
 * - Delete button removes a plan from the local state.
 *
 * BACKEND INTEGRATION:
 *   Replace local state with React Query:
 *     const { data: plans } = useQuery({ queryKey: ["plans"], queryFn: plansApi.list });
 *   Replace handleCreate with: useMutation({ mutationFn: plansApi.create, ... });
 *   Replace handleDelete with: useMutation({ mutationFn: plansApi.delete, ... });
 *
 * MOBILE: Cards stack in a single column on small screens.
 *         Dialog is full-width on mobile with proper touch targets.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { mockPlans, mockTasks } from "@/services/mockData";
import type { StudyPlan } from "@/types/models";
import { Plus, Trash2, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const PlansListPage = () => {
  const navigate = useNavigate();

  // ── State ────────────────────────────────────────────────────────────────────
  // Local copy of plans for create/delete operations.
  // TODO: Replace with server state via React Query when backend is ready.
  const [plans, setPlans] = useState<StudyPlan[]>(mockPlans);
  const [open, setOpen] = useState(false);       // Controls the create dialog visibility
  const [newTitle, setNewTitle] = useState("");   // New plan title input
  const [newStart, setNewStart] = useState("");   // New plan start date input
  const [newEnd, setNewEnd] = useState("");       // New plan end date input

  /**
   * getProgress — Calculates completion percentage for a plan.
   * Counts completed tasks vs total tasks for the given plan.
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
   * handleCreate — Creates a new plan from the dialog form inputs.
   * Validates that all fields are filled, then adds the plan to local state.
   *
   * TODO: Replace with plansApi.create({ title, start_date, end_date })
   */
  const handleCreate = () => {
    if (!newTitle || !newStart || !newEnd) return;
    const newPlan: StudyPlan = {
      plan_id: Date.now(), // Temporary ID — backend will assign a real one
      user: 1,             // FK to User — backend infers from auth token
      title: newTitle,
      start_date: newStart,
      end_date: newEnd,
    };
    setPlans([...plans, newPlan]);
    setOpen(false);
    // Reset form fields
    setNewTitle("");
    setNewStart("");
    setNewEnd("");
    toast.success("Study plan created!");
  };

  /**
   * handleDelete — Removes a plan from the local list.
   * e.stopPropagation() prevents the card's onClick (navigation) from firing.
   *
   * TODO: Replace with plansApi.delete(id)
   */
  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlans(plans.filter((p) => p.plan_id !== id));
    toast.success("Plan deleted.");
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        {/* ── Page Header with Create Button ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Study Plans</h1>
            <p className="text-sm text-muted-foreground">Manage your academic study plans</p>
          </div>

          {/* Create Plan Dialog */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1.5 h-4 w-4" /> Create Plan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Study Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {/* Plan title input */}
                <div className="space-y-2">
                  <Label>Plan Title</Label>
                  <Input placeholder="e.g. Internet Technology" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                </div>
                {/* Date range inputs — side by side on wider screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full">Create Plan</Button>
              </div>
            </DialogContent>
          </Dialog>
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
                className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
                onClick={() => navigate(`/plans/${plan.plan_id}`)}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <CardTitle className="text-base font-semibold">{plan.title}</CardTitle>
                  {/* Delete button — stopPropagation prevents card click */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(plan.plan_id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Date range display */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {plan.start_date} → {plan.end_date}
                  </div>
                  {/* Task count */}
                  <div className="text-xs text-muted-foreground">{taskCount} task{taskCount !== 1 ? "s" : ""}</div>
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
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
