import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { plansApi, tasksApi } from "@/services/api";
import type { StudyPlan, Task } from "@/types/models";
import { ArrowLeft, Plus, Save, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const statusConfig = {
  not_started: { label: "Not Started", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", className: "bg-info/10 text-info" },
  completed: { label: "Completed", className: "bg-success/10 text-success" },
};

const PlanDetailPage = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskEffort, setTaskEffort] = useState("");

  const numericPlanId = Number(planId);

  const loadPlan = async () => {
    if (!numericPlanId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const planResponse = (await plansApi.get(numericPlanId)) as StudyPlan;
      const tasksResponse = (await plansApi.getTasks(numericPlanId)) as { tasks: Task[] };
      setPlan(planResponse);
      setTitle(planResponse.title);
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
    loadPlan();
  }, [numericPlanId]);

  const handleSave = async () => {
    if (!plan) return;
    if (!title.trim()) {
      toast.error("Plan title cannot be empty");
      return;
    }

    try {
      const updated = (await plansApi.update(plan.plan_id, { title: title.trim() })) as StudyPlan;
      setPlan(updated);
      setTitle(updated.title);
      toast.success("Plan saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save plan");
    }
  };

  const handleCreateTask = async () => {
    if (!plan) return;
    if (!taskTitle || !taskDue || !taskEffort) {
      toast.error("Please fill in all task fields");
      return;
    }

    try {
      await tasksApi.create({
        plan_id: plan.plan_id,
        title: taskTitle,
        deadline_date: taskDue,
        estimated_effort_hours: Number(taskEffort),
      });
      setOpen(false);
      setTaskTitle("");
      setTaskDue("");
      setTaskEffort("");
      await loadPlan();
      toast.success("Task created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create task");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-muted-foreground">Loading plan...</div>
      </AppLayout>
    );
  }

  if (!plan) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Plan not found.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button variant="ghost" onClick={() => navigate("/plans")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Plans
          </Button>
          <Button onClick={handleSave} className="gap-1.5">
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>

        <div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-none bg-transparent p-0 font-display text-2xl font-bold text-foreground focus-visible:ring-0 h-auto"
          />
          <p className="mt-1 text-sm text-muted-foreground">
            {plan.start_date} - {plan.end_date}
          </p>
        </div>

        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-display text-lg font-semibold text-foreground">Tasks</h2>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Plus className="mr-1 h-4 w-4" /> Create Task</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Task Title</Label>
                    <Input placeholder="e.g. Write report" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Deadline</Label>
                      <Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Effort (hours)</Label>
                      <Input type="number" min={1} value={taskEffort} onChange={(e) => setTaskEffort(e.target.value)} />
                    </div>
                  </div>
                  <Button onClick={handleCreateTask} className="w-full">Create Task</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Task</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Deadline</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Effort</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => {
                      const sc = statusConfig[task.status];
                      return (
                        <tr key={task.task_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">{task.title}</td>
                          <td className="px-4 py-3 text-muted-foreground">{task.due_date}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{task.estimated_effort_hours} hrs</td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <Badge variant="secondary" className={sc.className}>{sc.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button size="icon" variant="ghost" onClick={() => navigate(`/tasks/${task.task_id}`)}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {tasks.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No tasks yet. Create one to get started.</td></tr>
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
