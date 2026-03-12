/**
 * DashboardPage.tsx — Main dashboard overview (Wireframe 2).
 *
 * ACCESSIBILITY (WCAG):
 *   - 1.4.3 Contrast: Status badges use colour + text label (not colour alone).
 *     Progress percentages shown as text alongside bars.
 *     "Due today" warning uses icon + text + colour.
 *   - 2.1.1 Keyboard: All "View" buttons are focusable and keyboard-operable.
 *     Progress cards are clickable and keyboard-activatable.
 *   - 4.1.3 Status Messages: Any actions triggering feedback use Sonner's aria-live.
 *   - Sections use aria-label for screen reader landmark identification.
 *   - Tables use <th scope="col"> for proper column association.
 *
 * BACKEND INTEGRATION:
 *   Replace `mockDashboard` with a React Query call:
 *     const { data } = useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.get });
 */

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { mockDashboard } from "@/services/mockData";
import { Eye, AlertTriangle, Clock } from "lucide-react";

// ─── Status Configuration ──────────────────────────────────────────────────────
// Maps TaskStatus values to display labels and badge CSS classes.
// Always pairs colour with text label (1.4.3 — not colour alone).

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  not_started: { label: "Not Started", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", className: "bg-info/10 text-info" },
  completed: { label: "Completed", className: "bg-success/10 text-success" },
};

const emptyDashboard: DashboardData = {
  progress_overview: [],
  todays_tasks: [],
  upcoming_deadlines: [],
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // TODO: Replace with React Query call to dashboardApi.get()
  const data = mockDashboard;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Welcome, {user?.email?.split("@")[0] || "User"}!
          </h1>
          <p className="text-sm text-muted-foreground">Here's what's on your plate today.</p>
        </div>

        {/* ── Section 1: Progress Overview ── */}
        {/* Clickable cards that navigate to the plan detail page */}
        <section aria-label="Progress overview">
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Progress Overview</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {data.progress_overview.map(({ plan, progress_percent }) => (
              <Card
                key={plan.plan_id}
                className="cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => navigate(`/plans/${plan.plan_id}`)} 
                tabIndex={0}
                role="link"
                aria-label={`View plan: ${plan.title}, ${progress_percent}% complete`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/plans/${plan.plan_id}`);
                  }
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{plan.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Progress</span>
                    <span className="font-semibold text-foreground">{progress_percent}%</span>
                  </div>
                  {/* Progress bar — value drives the fill width */}
                  <Progress value={progress_percent} className="h-2" aria-label={`${progress_percent}% complete`}/>
                </CardContent>
              </Card>
            </section>

        {/* ── Section 2: Today's Tasks ── */}
        {/* Table: Task | Plan | Deadline | [view] */}
        <section aria-label="Today's tasks">
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" aria-hidden="true"/>
            Today's Tasks
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Tasks scheduled for today">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Task</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Plan</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Deadline</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.todays_tasks.map((task) => (
                      <tr key={task.task_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{task.title}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{task.plan_title}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {/* Urgency indicator: icon + text + colour (1.4.3) */}
                          {task.days_until_due === 0 ? (
                            <span className="flex items-center gap-1 text-destructive font-medium">
                              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Due today
                            </span>
                          ) : (
                            `Due in ${task.days_until_due} day${task.days_until_due > 1 ? "s" : ""}`
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/tasks/${task.task_id}`)}
                            aria-label={`View task: ${task.title}`}
                          >
                            <Eye className="h-4 w-4 mr-1" aria-hidden="true" /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── Section 3: Upcoming Deadlines ── */}
        {/* Shows tasks with approaching due dates */}
        <section aria-label="Upcoming deadlines">
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
            Upcoming Deadlines
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Tasks with upcoming deadlines">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Task</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Plan</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Deadline</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.upcoming_deadlines.map((task) => (
                      <tr key={task.task_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{task.title}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{task.plan_title}</td>
                        <td className="px-4 py-3 text-muted-foreground">{task.due_date}</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/tasks/${task.task_id}`)}
                          aria-label={`View task: ${task.title}`}
                          >
                          <Eye className="h-4 w-4 mr-1" aria-hidden="true" /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
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

export default DashboardPage;
