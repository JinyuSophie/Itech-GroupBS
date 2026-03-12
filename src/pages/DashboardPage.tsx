/**
 * DashboardPage.tsx — Main dashboard overview (Wireframe 2).
 *
 * This page shows three sections:
 * 1. Progress Overview — Cards showing each plan's completion percentage.
 * 2. Today's Tasks — Table of tasks scheduled for today with status and urgency.
 * 3. Upcoming Deadlines — Table of tasks due soon.
 *
 * BACKEND INTEGRATION:
 *   Replace `mockDashboard` with a React Query call:
 *     const { data } = useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.get });
 *
 * MOBILE RESPONSIVENESS:
 *   - Progress cards stack vertically on small screens (grid-cols-1 → sm:2 → lg:3).
 *   - Tables scroll horizontally on narrow screens (overflow-x-auto).
 *   - Touch-friendly button and cell sizes.
 */
 
import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { mockDashboard } from "@/services/mockData";
import { Eye, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

// —— Status Configuration ————————————————————————————————————————————————
// Maps TaskStatus values to display labels and badge CSS classes.
// These classes use the semantic color tokens defined in index.css.

const statusConfig = {
  not_started: { label: "Not Started", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", className: "bg-info/10 text-info" },
  completed: { label: "Completed", className: "bg-success/10 text-success" },
};

const DashboardPage = () => {
  const navigate = useNavigate();

  // TODO: Replace with React Query call to dashboardApi.get()
  // const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.get });
  const data = mockDashboard;

  // Accessibility helpers
  const openPlanDetail = (planId: string) => {
    navigate(`/plans/${planId}`);
  };

  const openTaskDetail = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  const handlePlanCardKeyDown = (
    e: KeyboardEvent<HTMLDivElement>,
    planId: string
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPlanDetail(planId);
    }
  };

  const statusMessage =
    "Dashboard loaded successfully. Progress overview and task tables are available.";

  return (
    <AppLayout>
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>

      <div id="dashboard-main" className="animate-fade-in space-y-6">
          {/* —— Page Header —— */}
        <header>
          <h1 className="font-display text-2xl font-bold text-foreground">Welcome back!</h1>
          <p className="text-sm text-muted-foreground">Here's what's on your plate today.</p>

          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="mt-3 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-900"
          >
            {statusMessage}
          </div>
        </header>

        {/* —— Section 1: Progress Overview —— */}
        {/* Clickable cards that navigate to the plan detail page */}
        <section aria-labelledby="progress-overview-heading">
          <h2
            id="progress-overview-heading"
            className="mb-3 font-display text-lg font-semibold text-foreground"
          >
            Progress Overview
          </h2>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {data.progress_overview.map(({ plan, progress_percent }) => (
              <Card
                key={plan.plan_id}
                className="cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                role="button"
                tabIndex={0}
                aria-label={`Open ${plan.title}. Progress ${progress_percent} percent.`}
                onClick={() => openPlanDetail(plan.plan_id)}
                onKeyDown={(e) => handlePlanCardKeyDown(e, plan.plan_id)}
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
                  <Progress
                    value={progress_percent}
                    className="h-2"
                    aria-label={`${plan.title} progress ${progress_percent} percent`}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* —— Section 2: Today's Tasks —— */}
        {/* Shows tasks scheduled for today with status badges and deadline urgency */}
        <section aria-labelledby="todays-tasks-heading">
          <h2
            id="todays-tasks-heading"
            className="mb-3 font-display text-lg font-semibold text-foreground flex items-center gap-2"
          >
            <Clock className="h-5 w-5 text-accent" aria-hidden="true" focusable="false" />
            Today's Tasks
          </h2>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">
                    Today&apos;s tasks with plan, status, deadline and action
                  </caption>
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th
                        scope="col"
                        className="px-4 py-3 text-left font-medium text-muted-foreground"
                      >
                        Task
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell"
                      >
                        Plan
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left font-medium text-muted-foreground"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell"
                      >
                        Deadline
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right font-medium text-muted-foreground"
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.todays_tasks.map((task) => {
                      const sc = statusConfig[task.status];
                      return (
                        <tr
                          key={task.task_id}
                          className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-foreground">{task.title}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                            {task.plan_title}
                          </td>
                          <td className="px-4 py-3">
                            {/* Status badge using semantic color tokens */}
                            <Badge
                              variant="secondary"
                              className={sc.className}
                              aria-label={`Status: ${sc.label}`}
                            >
                              {sc.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            {/* Highlight tasks due today with a warning icon */}
                            {task.days_until_due === 0 ? (
                              <span className="flex items-center gap-1 text-destructive font-medium">
                                <AlertTriangle
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                  focusable="false"
                                />
                                Due today
                              </span>
                            ) : (
                              `Due in ${task.days_until_due} day${task.days_until_due > 1 ? "s" : ""}`
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {/* Navigate to the task detail page */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openTaskDetail(task.task_id)}
                              aria-label={`View details for ${task.title}`}
                            >
                              <Eye
                                className="h-4 w-4 mr-1"
                                aria-hidden="true"
                                focusable="false"
                              />
                              View
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* —— Section 3: Upcoming Deadlines —— */}
        {/* Shows tasks with approaching due dates */}
        <section aria-labelledby="upcoming-deadlines-heading">
          <h2
            id="upcoming-deadlines-heading"
            className="mb-3 font-display text-lg font-semibold text-foreground flex items-center gap-2"
          >
            <AlertTriangle
              className="h-5 w-5 text-warning"
              aria-hidden="true"
              focusable="false"
            />
            Upcoming Deadlines
          </h2>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">
                    Upcoming deadlines with related study plan and action
                  </caption>
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th
                        scope="col"
                        className="px-4 py-3 text-left font-medium text-muted-foreground"
                      >
                        Task
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell"
                      >
                        Plan
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left font-medium text-muted-foreground"
                      >
                        Deadline
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right font-medium text-muted-foreground"
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.upcoming_deadlines.map((task) => (
                      <tr
                        key={task.task_id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">{task.title}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {task.plan_title}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{task.due_date}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openTaskDetail(task.task_id)}
                            aria-label={`View details for ${task.title}`}
                          >
                            <Eye
                              className="h-4 w-4 mr-1"
                              aria-hidden="true"
                              focusable="false"
                            />
                            View
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