import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { plansApi } from "@/services/api";
import type { StudyPlan, Task } from "@/types/models";
import { Plus, Trash2, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

type TaskStats = { count: number; progress: number };

const PlansListPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [statsByPlan, setStatsByPlan] = useState<Record<number, TaskStats>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const loadPlans = async () => {
    setLoading(true);
    try {
      const plansData = (await plansApi.list()) as StudyPlan[];
      setPlans(plansData);

      const taskPayloads = await Promise.all(
        plansData.map(async (plan) => {
          const response = (await plansApi.getTasks(plan.plan_id)) as { tasks: Task[] };
          return { planId: plan.plan_id, tasks: response.tasks || [] };
        })
      );

      const nextStats: Record<number, TaskStats> = {};
      for (const item of taskPayloads) {
        const total = item.tasks.length;
        const completed = item.tasks.filter((task) => task.status === "completed").length;
        nextStats[item.planId] = {
          count: total,
          progress: total ? Math.round((completed / total) * 100) : 0,
        };
      }
      setStatsByPlan(nextStats);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load study plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleCreate = async () => {
    if (!newTitle || !newStart || !newEnd) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await plansApi.create({ title: newTitle, start_date: newStart, end_date: newEnd });
      setOpen(false);
      setNewTitle("");
      setNewStart("");
      setNewEnd("");
      await loadPlans();
      toast.success("Study plan created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create plan");
    }
  };

  const handleDelete = async (id: number, e: MouseEvent) => {
    e.stopPropagation();
    try {
      await plansApi.delete(id);
      await loadPlans();
      toast.success("Plan deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete plan");
    }
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Study Plans</h1>
            <p className="text-sm text-muted-foreground">Manage your academic study plans</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1.5 h-4 w-4" /> Create Plan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Study Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Plan Title</Label>
                  <Input placeholder="e.g. Internet Technology" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full">Create Plan</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading plans...</p>}

        {!loading && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const stats = statsByPlan[plan.plan_id] || { count: 0, progress: 0 };
              return (
                <Card
                  key={plan.plan_id}
                  className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
                  onClick={() => navigate(`/plans/${plan.plan_id}`)}
                >
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <CardTitle className="text-base font-semibold">{plan.title}</CardTitle>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(plan.plan_id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {plan.start_date} - {plan.end_date}
                    </div>
                    <div className="text-xs text-muted-foreground">{stats.count} task{stats.count !== 1 ? "s" : ""}</div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">{stats.progress}%</span>
                      </div>
                      <Progress value={stats.progress} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {plans.length === 0 && <p className="text-sm text-muted-foreground">No plans yet.</p>}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default PlansListPage;
