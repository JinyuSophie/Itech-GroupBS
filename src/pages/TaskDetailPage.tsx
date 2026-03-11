import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { plansApi, tasksApi } from "@/services/api";
import type { StudyPlan, Task, TaskStatus } from "@/types/models";
import { ArrowLeft, Save, Clock, CalendarDays, Target } from "lucide-react";
import { toast } from "sonner";

const statusOptions: { value: TaskStatus; label: string; progress: number }[] = [
  { value: "not_started", label: "Not Started", progress: 0 },
  { value: "in_progress", label: "In Progress", progress: 50 },
  { value: "completed", label: "Completed", progress: 100 },
];

const statusBadgeClass: Record<TaskStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-info/10 text-info",
  completed: "bg-success/10 text-success",
};

const TaskDetailPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [status, setStatus] = useState<TaskStatus>("not_started");
  const [loading, setLoading] = useState(true);

  const numericTaskId = Number(taskId);

  const loadTask = async () => {
    if (!numericTaskId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const taskResponse = (await tasksApi.get(numericTaskId)) as Task;
      setTask(taskResponse);
      setStatus(taskResponse.status);

      try {
        const planResponse = (await plansApi.get(taskResponse.plan)) as StudyPlan;
        setPlan(planResponse);
      } catch {
        setPlan(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load task");
      setTask(null);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [numericTaskId]);

  const currentStatus = statusOptions.find((option) => option.value === status) || statusOptions[0];

  const handleSave = async () => {
    if (!task) return;

    try {
      await tasksApi.updateStatus(task.task_id, { status });
      setTask({ ...task, status });
      toast.success("Task status updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update task");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-muted-foreground">Loading task...</div>
      </AppLayout>
    );
  }

  if (!task) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Task not found.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6 max-w-2xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button variant="ghost" onClick={() => navigate(plan ? `/plans/${plan.plan_id}` : "/plans")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Plan
          </Button>
          <Button onClick={handleSave} className="gap-1.5">
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{task.title}</h1>
          {plan && <p className="text-sm text-muted-foreground mt-1">{plan.title}</p>}
        </div>

        <Card>
          <CardContent className="pt-5 pb-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-foreground">Task Progress</span>
              </div>
              <Badge variant="secondary" className={statusBadgeClass[status]}>
                {currentStatus.label}
              </Badge>
            </div>
            <Progress value={currentStatus.progress} className="h-3" />
            <p className="text-xs text-muted-foreground text-right">{currentStatus.progress}% complete</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Deadline</p>
                <p className="text-sm font-medium text-foreground">{task.due_date}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Estimated Effort</p>
                <p className="text-sm font-medium text-foreground">{task.estimated_effort_hours} hours</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground mb-1.5">Status</p>
              <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-display text-lg font-semibold text-foreground">Scheduled Work</h2>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Hours</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No scheduled entries yet.</td>
                    </tr>
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

export default TaskDetailPage;
