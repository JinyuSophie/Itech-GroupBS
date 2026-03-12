import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { mockPlans, mockTasks } from "@/services/mockData";
import type { StudyPlan } from "@/types/models";
import { Plus, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

const PlansListPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<StudyPlan[]>(mockPlans);

  const getProgress = (planId: number) => {
    const tasks = mockTasks.filter((task) => task.plan === planId);
    if (!tasks.length) return 0;
    return Math.round((tasks.filter((task) => task.status === "completed").length / tasks.length) * 100);
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlans(plans.filter((plan) => plan.plan_id !== id));
    toast.success("Plan deleted.");
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Study Plans</h1>
            <p className="text-sm text-muted-foreground">Manage your academic study plans</p>
          </div>
          <Button onClick={() => navigate("/plans/new")} className="gap-1.5">
            <Plus className="h-4 w-4" /> Create Plan
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const progress = getProgress(plan.plan_id);
            const taskCount = mockTasks.filter((task) => task.plan === plan.plan_id).length;

            return (
              <Card
                key={plan.plan_id}
                className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => navigate(`/plans/${plan.plan_id}`)}
                tabIndex={0}
                role="link"
                aria-label={`View plan: ${plan.title}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/plans/${plan.plan_id}`);
                  }
                }}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <CardTitle className="text-base font-semibold">{plan.title}</CardTitle>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(plan.plan_id, e)}
                    aria-label={`Delete plan: ${plan.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    {plan.start_date} - {plan.end_date}
                  </div>
                  <div className="text-xs text-muted-foreground">{taskCount} task{taskCount !== 1 ? "s" : ""}</div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" aria-label={`${progress}% complete`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default PlansListPage;
