/**
 * CreatePlanPage.tsx — Standalone page to create a new Study Plan.
 *
 * WIREFRAME ALIGNMENT: Matches the sitemap route /plans/new (US02 – MUST).
 * The wireframe sitemap specifies this as a dedicated page rather than a
 * dialog/modal, so it is rendered as a full-page form inside AppLayout.
 *
 * LAYOUT:
 *   - "Back to Plans" button at the top for easy navigation.
 *   - A centered Card containing the creation form.
 *   - Form fields: Plan Title, Start Date, End Date.
 *   - Mobile-responsive: fields stack vertically on small screens.
 *
 * ACCESSIBILITY (WCAG):
 *   - All form fields have associated <Label> elements (2.1.1 Keyboard, 1.3.1 Info).
 *   - The success toast uses aria-live via Sonner for screen reader announcements (4.1.3 Status Messages).
 *   - Focus is managed: the first input receives focus on page load via autoFocus.
 *   - Error messages use role="alert" for immediate screen reader feedback.
 *
 * BACKEND INTEGRATION:
 *   Replace the local mock logic with:
 *     const mutation = useMutation({
 *       mutationFn: (data) => plansApi.create(data),
 *       onSuccess: () => { navigate("/plans"); }
 *     });
 *   The backend endpoint is POST /api/plans/ with body:
 *     { title: string, start_date: "YYYY-MM-DD", end_date: "YYYY-MM-DD" }
 *   The backend infers the `user` FK from the Authorization token.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const CreatePlanPage = () => {
  const navigate = useNavigate();

  // ── Form State ────────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");        // Plan title input
  const [startDate, setStartDate] = useState(""); // ISO date string for plan start
  const [endDate, setEndDate] = useState("");     // ISO date string for plan end
  const [error, setError] = useState("");         // Inline validation error

  /**
   * handleSubmit — Validates form and creates a new plan.
   *
   * Validation rules:
   *   1. All three fields are required.
   *   2. End date must be after start date.
   *
   * TODO: Replace with useMutation calling plansApi.create()
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation — all fields required
    if (!title.trim() || !startDate || !endDate) {
      setError("Please fill in all fields.");
      return;
    }

    // Ensure date range is valid
    if (new Date(endDate) <= new Date(startDate)) {
      setError("End date must be after start date.");
      return;
    }

    // TODO: Replace with API call:
    // await plansApi.create({ title, start_date: startDate, end_date: endDate });
    toast.success("Study plan created!");
    navigate("/plans"); // Redirect back to the plans list
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6 max-w-lg mx-auto">
        {/* ── Top Bar: Back Button ── */}
        {/* Provides navigation back to the plans list (keyboard accessible) */}
        <Button
          variant="ghost"
          onClick={() => navigate("/plans")}
          className="gap-1.5"
          aria-label="Go back to plans list"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Plans
        </Button>

        {/* ── Page Heading ── */}
        <h1 className="font-display text-2xl font-bold text-foreground">Create Study Plan</h1>

        {/* ── Creation Form Card ── */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Plan Title Field */}
              <div className="space-y-2">
                <Label htmlFor="plan-title">Plan Title</Label>
                <Input
                  id="plan-title"
                  placeholder="e.g. Internet Technology Coursework"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Date Range Fields — side by side on wider screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Inline Error — uses role="alert" for screen reader announcement (4.1.3) */}
              {error && (
                <p className="text-sm text-destructive animate-fade-in" role="alert">
                  {error}
                </p>
              )}

              {/* Submit Button — full width for easy mobile tap target */}
              <Button type="submit" className="w-full gap-1.5">
                <Save className="h-4 w-4" /> Create Plan
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CreatePlanPage;