import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { plansApi, tasksApi, scheduleEntriesApi } from "@/services/api";
import type { ProgressLog, ScheduleEntry, StudyPlan, Task } from "@/types/models";
import { BarChart3, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";

type PlanProgress = { plan: StudyPlan; progress_percent: number };

type SummaryState = {
  tasksCompleted: number;
  totalEffortHours: number;
  remainingWorkloadHours: number;
  plansProgress: PlanProgress[];
};

const startAndEndOfWeek = () => {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(today);
  start.setDate(today.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const formatDate = (date: Date) => date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const WeeklySummaryPage = () => {
  const [summary, setSummary] = useState<SummaryState>({
    tasksCompleted: 0,
    totalEffortHours: 0,
    remainingWorkloadHours: 0,
    plansProgress: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const plans = (await plansApi.list()) as StudyPlan[];
        const taskPayloads = await Promise.all(plans.map((plan) => plansApi.getTasks(plan.plan_id) as Promise<{ tasks: Task[] }>));
        const tasksByPlan = plans.map((plan, index) => ({ plan, tasks: taskPayloads[index].tasks || [] }));
        const allTasks = tasksByPlan.flatMap((item) => item.tasks);

        const entryPayloads = await Promise.all(allTasks.map((task) => tasksApi.getScheduleEntries(task.task_id) as Promise<{ schedule_entries: ScheduleEntry[] }>));
        const allEntries = entryPayloads.flatMap((payload) => payload.schedule_entries || []);
        const { start, end } = startAndEndOfWeek();
        const weekEntries = allEntries.filter((entry) => {
          const date = new Date(entry.scheduled_date);
          return date >= start && date <= end;
        });

        const logPayloads = await Promise.all(weekEntries.map((entry) => scheduleEntriesApi.getProgressLogs(entry.entry_id) as Promise<{ progress_logs: ProgressLog[] }>));
        const totalEffortHours = logPayloads
          .flatMap((payload) => payload.progress_logs || [])
          .reduce((sum, log) => sum + log.actual_effort_hours, 0);

        const tasksCompleted = allTasks.filter((task) => task.status === "completed").length;
        const remainingWorkloadHours = allTasks
          .filter((task) => task.status !== "completed")
          .reduce((sum, task) => sum + task.estimated_effort_hours, 0);

        const plansProgress = tasksByPlan.map(({ plan, tasks }) => ({
          plan,
          progress_percent: tasks.length ? Math.round((tasks.filter((task) => task.status === "completed").length / tasks.length) * 100) : 0,
        }));

        setSummary({ tasksCompleted, totalEffortHours, remainingWorkloadHours, plansProgress });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load weekly summary");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const { start, end } = startAndEndOfWeek();

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <header className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-foreground">Weekly Summary</h1>
          <p className="text-sm text-muted-foreground">{formatDate(start)} – {formatDate(end)}</p>
        </header>

        {loading ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading summary...</CardContent></Card>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <Card><CardContent className="flex items-center gap-3 pt-5"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></div><div><p className="text-2xl font-bold">{summary.tasksCompleted}</p><p className="text-xs text-muted-foreground">Tasks Completed</p></div></CardContent></Card>
              <Card><CardContent className="flex items-center gap-3 pt-5"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10"><Clock className="h-5 w-5 text-info" /></div><div><p className="text-2xl font-bold">{summary.totalEffortHours}h</p><p className="text-xs text-muted-foreground">Effort This Week</p></div></CardContent></Card>
              <Card><CardContent className="flex items-center gap-3 pt-5"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><TrendingUp className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">{summary.remainingWorkloadHours}h</p><p className="text-xs text-muted-foreground">Remaining Workload</p></div></CardContent></Card>
            </section>

            <section aria-label="Plans progress" className="space-y-3">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground"><BarChart3 className="h-5 w-5 text-accent" /> Plans Progress</h2>
              <Card>
                <CardContent className="space-y-4 p-5">
                  {summary.plansProgress.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No plans available.</p>
                  ) : (
                    summary.plansProgress.map(({ plan, progress_percent }) => (
                      <div key={plan.plan_id}>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{plan.title}</span>
                          <span className="text-muted-foreground">{progress_percent}%</span>
                        </div>
                        <Progress value={progress_percent} className="h-2" aria-label={`${plan.title} ${progress_percent}% complete`} />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default WeeklySummaryPage;
