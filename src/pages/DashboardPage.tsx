import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { mockDashboard } from "@/services/mockData";
import { Eye, AlertTriangle, Clock } from "lucide-react";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
                  <Progress value={progress_percent} className="h-2" aria-label={`${progress_percent}% complete`} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-label="Today's tasks">
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" aria-hidden="true" />
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
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
