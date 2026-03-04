/**
 * WeeklySummaryPage.tsx — Weekly productivity summary (Wireframe 6).
 *
 * Displays aggregated statistics for the current week:
 * - Tasks Completed count
 * - Total Effort Hours this week
 * - Remaining Workload Hours across all plans
 * - Per-plan progress bars
 *
 * BACKEND INTEGRATION:
 *   Replace mockWeeklySummary with:
 *     const { data } = useQuery({ queryKey: ["summary"], queryFn: summaryApi.weekly });
 *
 * MOBILE:
 *   - Stat cards stack vertically on small screens (grid-cols-1 → sm:3).
 *   - Full-width progress bars adapt to any screen width.
 */

import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { mockWeeklySummary } from "@/services/mockData";
import { CheckCircle2, Clock, BarChart3, TrendingUp } from "lucide-react";

const WeeklySummaryPage = () => {
  // TODO: Replace with React Query call to summaryApi.weekly()
  const data = mockWeeklySummary;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6 max-w-3xl">
        {/* ── Page Header ── */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Weekly Summary</h1>
          <p className="text-sm text-muted-foreground">
            {data.week_start} — {data.week_end}
          </p>
        </div>

        {/* ── Stat Cards ── */}
        {/* Three key metrics displayed in a responsive grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {/* Tasks Completed */}
          <Card>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data.tasks_completed}</p>
                <p className="text-xs text-muted-foreground">Tasks Completed</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Effort This Week */}
          <Card>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data.total_effort_hours}h</p>
                <p className="text-xs text-muted-foreground">Effort This Week</p>
              </div>
            </CardContent>
          </Card>

          {/* Remaining Workload */}
          <Card>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data.remaining_workload_hours}h</p>
                <p className="text-xs text-muted-foreground">Remaining Workload</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Plans Progress Section ── */}
        {/* Shows a progress bar for each study plan's completion percentage */}
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            Plans Progress
          </h2>
          <Card>
            <CardContent className="p-5 space-y-4">
              {data.plans_progress.map(({ plan, progress_percent }) => (
                <div key={plan.plan_id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium text-foreground">{plan.title}</span>
                    <span className="text-muted-foreground">{progress_percent}%</span>
                  </div>
                  {/* Progress bar — value from backend aggregation */}
                  <Progress value={progress_percent} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
};

export default WeeklySummaryPage;
