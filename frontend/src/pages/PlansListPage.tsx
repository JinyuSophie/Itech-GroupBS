import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { plansApi } from "@/services/api";
import type { StudyPlan } from "@/types/models";
import { Plus, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

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
      const statsEntries = await Promise.all(plansData.map(async (plan) => {
        const payload = await plansApi.getTasks(plan.plan_id) as { tasks: any[] };
        const tasks = payload.tasks || [];
        const completed = tasks.filter((task) => task.status === 'completed').length;
        return [plan.plan_id, { count: tasks.length, progress: tasks.length ? Math.round((completed / tasks.length) * 100) : 0 }] as const;
      }));
      setStatsByPlan(Object.fromEntries(statsEntries));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPlans(); }, []);

  const handleDelete = async (planId: number) => {
    try {
      await plansApi.delete(planId);
      toast.success('Plan deleted');
      loadPlans();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete plan');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between"><div><h1 className="font-display text-2xl font-bold">Study Plans</h1><p className="text-sm text-muted-foreground">Manage your coursework and revision plans.</p></div><Button onClick={() => navigate('/plans/new')} className="gap-1.5"><Plus className="h-4 w-4" />Create Plan</Button></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const stats = statsByPlan[plan.plan_id] || { count: 0, progress: 0 };
            return <Card key={plan.plan_id} className="cursor-pointer" onClick={() => navigate(`/plans/${plan.plan_id}`)}><CardHeader><CardTitle className="text-lg">{plan.title}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" />{plan.start_date} → {plan.end_date}</div><div><div className="mb-1 flex items-center justify-between text-xs text-muted-foreground"><span>{stats.count} tasks</span><span>{stats.progress}% complete</span></div><Progress value={stats.progress} className="h-2" /></div><div className="flex justify-end"><Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(plan.plan_id); }} className="text-destructive"><Trash2 className="h-4 w-4 mr-1" />Delete</Button></div></CardContent></Card>
          })}
        </div>
        {!loading && plans.length === 0 && <p className="text-sm text-muted-foreground">No plans yet.</p>}
      </div>
    </AppLayout>
  );
};

export default PlansListPage;
