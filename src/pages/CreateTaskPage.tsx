/**
 * CreateTaskPage.tsx — Standalone page to create a new Task under a Study Plan.
 *
 * WIREFRAME ALIGNMENT: Matches the sitemap route /tasks/new (US03 – MUST).
 * The wireframe sitemap shows task creation as a dedicated page, not a dialog.
 *
 * QUERY PARAMETER:
 *   ?plan={plan_id} — Required. Specifies which plan the new task belongs to.
 *   This is passed as a URL search parameter when navigating from PlanDetailPage.
 *   Example: /tasks/new?plan=1
 *
 * LAYOUT:
 *   - "Back to Plan" button navigates to the parent plan's detail page.
 *   - Form fields: Task Title, Deadline (date picker), Estimated Effort (hours).
 *   - Mobile-responsive: fields stack vertically on small screens.
 *
 * ACCESSIBILITY (WCAG):
 *   - All form fields have <Label> elements linked via htmlFor/id (2.1.1 Keyboard).
 *   - Error messages use role="alert" (4.1.3 Status Messages).
 *   - Success toast announced via aria-live region (4.1.3).
 *   - autoFocus on first input for keyboard users.
 *
 * BACKEND INTEGRATION:
 *   Replace mock logic with:
 *     const mutation = useMutation({
 *       mutationFn: (data) => tasksApi.create(data),
 *       onSuccess: () => navigate(`/plans/${planId}`)
 *     });
 *   Endpoint: POST /api/tasks/ with body:
 *     { plan: number, title: string, due_date: "YYYY-MM-DD", estimated_effort_hours: number }
 *   The new task's default status is "not_started" (set by the backend).
 */

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockPlans } from "@/services/mockData";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const CreateTaskPage = () => {
  const navigate = useNavigate();

  // ── Query Params ──────────────────────────────────────────────────────────
  // Read the parent plan ID from the URL search params: /tasks/new?plan=1
  const [searchParams] = useSearchParams();
  const planId = Number(searchParams.get("plan"));

  // Look up the parent plan for display and navigation
  const plan = mockPlans.find((p) => p.plan_id === planId);

  // ── Form State ────────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");         // Task title input
  const [dueDate, setDueDate] = useState("");     // Deadline date input
  const [effort, setEffort] = useState("");       // Estimated effort in hours
  const [error, setError] = useState("");         // Inline validation error

  /**
   * handleSubmit — Validates and creates a new task.
   *
   * Validation:
   *   1. All fields required.
   *   2. Effort must be a positive number.
   *
   * TODO: Replace with useMutation calling tasksApi.create()
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !dueDate || !effort) {
      setError("Please fill in all fields.");
      return;
    }

    if (Number(effort) <= 0) {
      setError("Effort must be a positive number.");
      return;
    }

    // TODO: Replace with API call:
    // await tasksApi.create({ plan: planId, title, due_date: dueDate, estimated_effort_hours: Number(effort) });
    toast.success("Task created! Weekly schedule updated.");
    navigate(`/plans/${planId}`); // Return to the parent plan's detail page
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6 max-w-lg mx-auto">
        {/* ── Top Bar: Back Button ── */}
        <Button
          variant="ghost"
          onClick={() => navigate(plan ? `/plans/${plan.plan_id}` : "/plans")}
          className="gap-1.5"
          aria-label="Go back to plan detail"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Plan
        </Button>

        {/* ── Page Heading ── */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Create Task</h1>
          {/* Show the parent plan name as context */}
          {plan && (
            <p className="text-sm text-muted-foreground mt-1">
              Adding task to: <span className="font-medium text-foreground">{plan.title}</span>
            </p>
          )}
        </div>

        {/* ── Creation Form Card ── */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Task Title */}
              <div className="space-y-2">
                <Label htmlFor="task-title">Task Title</Label>
                <Input
                  id="task-title"
                  placeholder="e.g. Write design specification"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Deadline and Effort — side by side on wider screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-deadline">Deadline</Label>
                  <Input
                    id="task-deadline"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-effort">Estimated Effort (hours)</Label>
                  <Input
                    id="task-effort"
                    type="number"
                    min={1}
                    placeholder="e.g. 6"
                    value={effort}
                    onChange={(e) => setEffort(e.target.value)}
                  />
                </div>
              </div>

              {/* Inline Error — role="alert" for screen reader (4.1.3) */}
              {error && (
                <p className="text-sm text-destructive animate-fade-in" role="alert">
                  {error}
                </p>
              )}

              {/* Submit Button */}
              <Button type="submit" className="w-full gap-1.5">
                <Save className="h-4 w-4" /> Create Task
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CreateTaskPage;