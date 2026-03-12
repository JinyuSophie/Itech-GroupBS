/**
 * EditPlanPage.tsx — Standalone page to edit an existing Study Plan.
 *
 * WIREFRAME ALIGNMENT: Matches the sitemap route /plans/{plan_id}/edit (US02 – MUST).
 * Separated from PlanDetailPage so that viewing tasks and editing plan metadata
 * are distinct user flows, as shown in the wireframe sitemap.
 *
 * LAYOUT:
 *   - "Back to Plan" button returns to the Plan Detail view.
 *   - Editable fields: Title, Start Date, End Date.
 *   - Save button persists changes.
 *
 * ACCESSIBILITY (WCAG):
 *   - All inputs have associated <Label> elements for screen readers (2.1.1 Keyboard).
 *   - Save confirmation uses toast with aria-live for screen reader announcement (4.1.3).
 *   - Error messages use role="alert" (4.1.3 Status Messages).
 *
 * BACKEND INTEGRATION:
 *   Fetch plan data:
 *     const { data: plan } = useQuery({
 *       queryKey: ["plan", planId],
 *       queryFn: () => plansApi.get(planId)
 *     });
 *   Save changes:
 *     const mutation = useMutation({
 *       mutationFn: (data) => plansApi.update(planId, data),
 *       onSuccess: () => navigate(`/plans/${planId}`)
 *     });
 *   Endpoint: PUT /api/plans/{plan_id}/ with body:
 *     { title: string, start_date: "YYYY-MM-DD", end_date: "YYYY-MM-DD" }
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockPlans } from "@/services/mockData";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const EditPlanPage = () => {
  // ── Route Params ──────────────────────────────────────────────────────────
  // planId comes from the URL: /plans/:planId/edit
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  // Find the plan from mock data by its numeric ID
  const plan = mockPlans.find((p) => p.plan_id === Number(planId));

  // ── Form State ────────────────────────────────────────────────────────────
  // Pre-populated with existing plan data for editing
  const [title, setTitle] = useState(plan?.title || "");
  const [startDate, setStartDate] = useState(plan?.start_date || "");
  const [endDate, setEndDate] = useState(plan?.end_date || "");
  const [error, setError] = useState("");

  // ── Not Found State ───────────────────────────────────────────────────────
  if (!plan) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground" role="status">
          Plan not found.
        </div>
      </AppLayout>
    );
  }

  /**
   * handleSave — Validates and persists edited plan data.
   *
   * TODO: Replace with plansApi.update(plan.plan_id, { title, start_date, end_date })
   */
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !startDate || !endDate) {
      setError("Please fill in all fields.");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError("End date must be after start date.");
      return;
    }

    // TODO: Replace with API mutation call
    toast.success("Plan updated!");
    navigate(`/plans/${plan.plan_id}`); // Return to the plan detail view
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6 max-w-lg mx-auto">
        {/* ── Top Bar: Back Button ── */}
        <Button
          variant="ghost"
          onClick={() => navigate(`/plans/${plan.plan_id}`)}
          className="gap-1.5"
          aria-label="Go back to plan detail"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Plan
        </Button>

        {/* ── Page Heading ── */}
        <h1 className="font-display text-2xl font-bold text-foreground">Edit Plan</h1>

        {/* ── Edit Form Card ── */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="space-y-4">
              {/* Plan Title */}
              <div className="space-y-2">
                <Label htmlFor="edit-title">Plan Title</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start">Start Date</Label>
                  <Input
                    id="edit-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-end">End Date</Label>
                  <Input
                    id="edit-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Inline Error — role="alert" for screen reader announcement */}
              {error && (
                <p className="text-sm text-destructive animate-fade-in" role="alert">
                  {error}
                </p>
              )}

              {/* Save Button */}
              <Button type="submit" className="w-full gap-1.5">
                <Save className="h-4 w-4" /> Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default EditPlanPage;