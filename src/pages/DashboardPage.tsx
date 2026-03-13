import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardApi } from "@/services/api";
import type { DashboardData } from "@/types/models";
import { Eye, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";

const emptyDashboard: DashboardData = {
  progress_overview: [],
  todays_tasks: [],
  upcoming_deadlines: [],
};

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>(emptyDashboard);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = (await dashboardApi.get()) as DashboardData;
        setData(response);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <header className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-foreground">Welcome, {user?.email?.split("@")[0] || "User"}!</h1>
          <p className="text-sm text-muted-foreground">Progress overview, today&apos;s tasks, and upcoming deadlines.</p>
        </header>

        <section aria-label="Progress overview" className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Progress Overview</h2>
          {loading ? (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading progress...</CardContent></Card>
          ) : data.progress_overview.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No study plans yet.</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.progress_overview.map(({ plan, progress_percent }) => (
                <Card
                  key={plan.plan_id}
                  role="link"
                  tabIndex={0}
                  className="cursor-pointer border-border/80 transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => navigate(`/plans/${plan.plan_id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/plans/${plan.plan_id}`);
                    }
                  }}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{plan.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-foreground">{progress_percent}%</span>
                    </div>
                    <Progress value={progress_percent} aria-label={`${plan.title} ${progress_percent}% complete`} className="h-2" />
                    <p className="text-xs text-muted-foreground">{formatDate(plan.start_date)} – {formatDate(plan.end_date)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section aria-label="Today's tasks" className="space-y-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Clock className="h-5 w-5 text-accent" aria-hidden="true" /> Today&apos;s Tasks
            </h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Task</th>
                        <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                        <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Deadline</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium text-muted-foreground">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.todays_tasks.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No tasks due today.</td></tr>
                      ) : (
                        data.todays_tasks.map((task) => (
                          <tr key={task.task_id} className="border-b last:border-0">
                            <td className="px-4 py-3 font-medium text-foreground">{task.title}</td>
                            <td className="px-4 py-3 text-muted-foreground">{task.plan_title}</td>
                            <td className="px-4 py-3 text-destructive">
                              <span className="inline-flex items-center gap-1 font-medium">
                                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Due today
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button size="sm" variant="ghost" onClick={() => navigate(`/tasks/${task.task_id}`)}>
                                <Eye className="mr-1 h-4 w-4" aria-hidden="true" /> View
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>

          <section aria-label="Upcoming deadlines" className="space-y-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" /> Upcoming Deadlines
            </h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Task</th>
                        <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                        <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Deadline</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium text-muted-foreground">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.upcoming_deadlines.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No upcoming deadlines.</td></tr>
                      ) : (
                        data.upcoming_deadlines.map((task) => (
                          <tr key={task.task_id} className="border-b last:border-0">
                            <td className="px-4 py-3 font-medium text-foreground">{task.title}</td>
                            <td className="px-4 py-3 text-muted-foreground">{task.plan_title}</td>
                            <td className="px-4 py-3 text-muted-foreground">{formatDate(task.due_date)}</td>
                            <td className="px-4 py-3 text-right">
                              <Button size="sm" variant="ghost" onClick={() => navigate(`/tasks/${task.task_id}`)}>
                                <Eye className="mr-1 h-4 w-4" aria-hidden="true" /> View
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
