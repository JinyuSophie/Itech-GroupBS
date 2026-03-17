import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { plansApi, tasksApi } from "@/services/api";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const CreateTaskPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const planId = Number(params.get('plan'));
  const [planTitle, setPlanTitle] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [effort, setEffort] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!planId) return;
    plansApi.get(planId).then((plan: any) => setPlanTitle(plan.title)).catch(() => undefined);
  }, [planId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!planId) return setError('Missing plan id.');
    if (!title.trim() || !dueDate || !effort) return setError('Please fill in all fields.');
    if (Number(effort) <= 0) return setError('Effort must be a positive number.');
    try {
      await tasksApi.create({ plan_id: planId, title, deadline_date: dueDate, estimated_effort_hours: Number(effort) });
      toast.success('Task created and schedule generated');
      navigate(`/plans/${planId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create task');
    }
  };

  return <AppLayout><div className="space-y-6 max-w-lg mx-auto"><Button variant="ghost" onClick={() => navigate(planId ? `/plans/${planId}` : '/plans')} className="gap-1.5"><ArrowLeft className="h-4 w-4" />Back to Plan</Button><div><h1 className="font-display text-2xl font-bold">Create Task</h1>{planTitle && <p className="text-sm text-muted-foreground mt-1">Adding task to: <span className="font-medium text-foreground">{planTitle}</span></p>}</div><Card><CardContent className="pt-6"><form onSubmit={handleSubmit} className="space-y-4"><div className="space-y-2"><Label htmlFor="task-title">Task Title</Label><Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="task-deadline">Deadline</Label><Input id="task-deadline" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="task-effort">Estimated Effort (hours)</Label><Input id="task-effort" type="number" min={1} value={effort} onChange={(e) => setEffort(e.target.value)} /></div></div>{error && <p className="text-sm text-destructive" role="alert">{error}</p>}<Button type="submit" className="w-full gap-1.5"><Save className="h-4 w-4" />Create Task</Button></form></CardContent></Card></div></AppLayout>;
};

export default CreateTaskPage;
