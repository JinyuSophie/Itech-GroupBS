import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { plansApi } from "@/services/api";
import type { StudyPlan, Task } from "@/types/models";
import { ArrowLeft, Plus, Pencil, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; className: string }> = {
  not_started: { label: 'Not Started', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', className: 'bg-info/10 text-info' },
  completed: { label: 'Completed', className: 'bg-success/10 text-success' },
};

const PlanDetailPage = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const numericPlanId = Number(planId);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [planData, tasksData] = await Promise.all([plansApi.get(numericPlanId), plansApi.getTasks(numericPlanId)]);
      setPlan(planData as StudyPlan);
      setTasks(((tasksData as any).tasks || []) as Task[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (numericPlanId) load(); }, [numericPlanId]);

  if (!loading && !plan) return <AppLayout><div className="py-20 text-center text-muted-foreground">Plan not found.</div></AppLayout>;

  return <AppLayout><div className="space-y-6"><div className="flex items-center justify-between flex-wrap gap-2"><Button variant="ghost" onClick={() => navigate('/plans')} className="gap-1.5"><ArrowLeft className="h-4 w-4" />Back to Plans</Button><div className="flex items-center gap-2"><Button variant="outline" onClick={() => navigate(`/plans/${numericPlanId}/edit`)} className="gap-1.5"><Pencil className="h-4 w-4" />Edit</Button></div></div><div><h1 className="font-display text-2xl font-bold">{plan?.title}</h1>{plan && <p className="text-sm text-muted-foreground mt-1">{plan.start_date} - {plan.end_date}</p>}</div><section aria-label="Plan tasks"><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Tasks</h2><Button size="sm" variant="outline" onClick={() => navigate(`/tasks/new?plan=${numericPlanId}`)} className="gap-1"><Plus className="h-4 w-4" />Create Task</Button></div><Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/50"><th className="px-4 py-3 text-left">Task</th><th className="px-4 py-3 text-left">Deadline</th><th className="px-4 py-3 text-left hidden sm:table-cell">Effort</th><th className="px-4 py-3 text-left hidden sm:table-cell">Status</th><th className="px-4 py-3 text-right">View</th></tr></thead><tbody>{tasks.map((task) => { const sc = statusConfig[task.status] || statusConfig.not_started; return <tr key={task.task_id} className="border-b last:border-0 hover:bg-muted/30"><td className="px-4 py-3 font-medium">{task.title}</td><td className="px-4 py-3 text-muted-foreground">{task.due_date}</td><td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{task.estimated_effort_hours} hrs</td><td className="px-4 py-3 hidden sm:table-cell"><Badge variant="secondary" className={sc.className}>{sc.label}</Badge></td><td className="px-4 py-3 text-right"><Button size="icon" variant="ghost" onClick={() => navigate(`/tasks/${task.task_id}`)}><ChevronRight className="h-4 w-4" /></Button></td></tr>; })}{!loading && tasks.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No tasks yet. Create one to get started.</td></tr>}</tbody></table></div></CardContent></Card></section></div></AppLayout>;
};

export default PlanDetailPage;
