import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { mockPlans, mockTasks } from "@/services/mockData";
import type { StudyPlan } from "@/types/models";
import { Plus, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const PlansListPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [statsByPlan, setStatsByPlan] = useState<Record<number, { count: number; progress: number }>>({});
  const [loading, setLoading] = useState(true);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const plansData = (await plansApi.list()) as StudyPlan[];
      setPlans(plansData);

      const statsEntries = await Promise.all(
        plansData.map(async (plan) => {
          const payload = (await plansApi.getTasks(plan.plan_id)) as { tasks: Task[] };
          const tasks = payload.tasks || [];
          const completed = tasks.filter((task) => task.status === "completed").length;
          return [
            plan.plan_id,
            {
              count: tasks.length,
              progress: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
            },
          ] as const;
        }),
      );

      setStatsByPlan(Object.fromEntries(statsEntries));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await plansApi.delete(id);
      toast.success("Plan deleted");
      await loadPlans();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete plan");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Study Plans</h1>
            <p className="text-sm text-muted-foreground">Your plans in a clean card layout matching the wireframes.</p>
          </div>
          <Button onClick={() => navigate("/plans/new")} className="gap-1.5">
            <Plus className="h-4 w-4" /> Create Plan
          </Button>
        </div>

        {loading ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Loading plans...</CardContent></Card>
        ) : plans.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No plans yet. Create your first study plan.</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => {
              const stats = statsByPlan[plan.plan_id] || { count: 0, progress: 0 };
              return (
                <Card
                  key={plan.plan_id}
                  role="link"
                  tabIndex={0}
                  className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => navigate(`/plans/${plan.plan_id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/plans/${plan.plan_id}`);
                    }
                  }}
                >
                  <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                    <CardTitle className="text-base">{plan.title}</CardTitle>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      aria-label={`Delete plan ${plan.title}`}
                      onClick={(e) => void handleDelete(plan.plan_id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{formatDate(plan.start_date)} – {formatDate(plan.end_date)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{stats.count} task{stats.count === 1 ? "" : "s"}</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">{stats.progress}%</span>
                      </div>
                      <Progress value={stats.progress} className="h-2" aria-label={`${plan.title} ${stats.progress}% complete`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default PlansListPage;
