import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { plansApi } from "@/services/api";
import type { StudyPlan, Task, TaskStatus } from "@/types/models";
import { ArrowLeft, Plus, ChevronRight, Pencil } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  not_started: { label: "Not Started", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", className: "bg-info/10 text-info" },
  completed: { label: "Completed", className: "bg-success/10 text-success" },
};

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const PlanDetailPage = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const numericPlanId = Number(planId);

  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlan = async () => {
    setLoading(true);
    try {
      const [planResponse, tasksResponse] = await Promise.all([
        plansApi.get(numericPlanId) as Promise<StudyPlan>,
        plansApi.getTasks(numericPlanId) as Promise<{ plan: StudyPlan; tasks: Task[] }>,
      ]);
      setPlan(planResponse);
      setTasks(tasksResponse.tasks || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load plan");
      setPlan(null);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (numericPlanId) {
      loadPlan();
    } else {
      setLoading(false);
    }
  }, [numericPlanId]);

  if (loading) {
    return <AppLayout><div className="py-20 text-center text-muted-foreground">Loading plan...</div></AppLayout>;
  }

  if (!plan) {
    return <AppLayout><div className="py-20 text-center text-muted-foreground">Plan not found.</div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" className="gap-1.5" onClick={() => navigate("/plans") }>
            <ArrowLeft className="h-4 w-4" /> Back to Plans
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-1.5" onClick={() => navigate(`/plans/${plan.plan_id}/edit`)}>
              <Pencil className="h-4 w-4" /> Edit Plan
            </Button>
            <Button className="gap-1.5" onClick={() => navigate(`/tasks/new?plan=${plan.plan_id}`)}>
              <Plus className="h-4 w-4" /> Create Tasks
            </Button>
          </div>
        </div>

        <header className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-foreground">{plan.title}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(plan.start_date)} – {formatDate(plan.end_date)}</p>
          <p className="text-sm text-success" role="status" aria-live="polite">Weekly schedule updated</p>
        </header>

        <section aria-label="Tasks" className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Tasks</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Task</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Deadline</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Effort</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium text-muted-foreground">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No tasks created for this plan yet.</td></tr>
                    ) : (
                      tasks.map((task) => (
                        <tr key={task.task_id} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium text-foreground">{task.title}</td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(task.due_date)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{task.estimated_effort_hours} hrs</td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className={statusConfig[task.status].className}>{statusConfig[task.status].label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/tasks/${task.task_id}`)}>
                              <ChevronRight className="h-4 w-4" />
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
    </AppLayout>
  );
};

export default PlanDetailPage;
