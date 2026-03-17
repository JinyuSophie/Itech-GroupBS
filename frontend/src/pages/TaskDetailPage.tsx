import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { plansApi, tasksApi } from "@/services/api";
import type { ScheduleEntry, StudyPlan, Task, TaskStatus } from "@/types/models";
import { ArrowLeft, Save, Clock, CalendarDays, Target, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const statusOptions: { value: TaskStatus; label: string; progress: number }[] = [
  { value: 'not_started', label: 'Not Started', progress: 0 },
  { value: 'in_progress', label: 'In Progress', progress: 50 },
  { value: 'completed', label: 'Completed', progress: 100 },
];

const statusBadgeClass: Record<TaskStatus, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-info/10 text-info',
  completed: 'bg-success/10 text-success',
};

const TaskDetailPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const numericTaskId = Number(taskId);
  const [task, setTask] = useState<Task | null>(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [status, setStatus] = useState<TaskStatus>('not_started');
  const [loading, setLoading] = useState(true);

  const loadTask = async () => {
    if (!numericTaskId) return;
    setLoading(true);
    try {
      const taskResponse = (await tasksApi.get(numericTaskId)) as Task;
      setTask(taskResponse);
      setStatus(taskResponse.status);
      const [planResponse, scheduleResponse] = await Promise.all([
        plansApi.get(taskResponse.plan) as Promise<StudyPlan>,
        tasksApi.getScheduleEntries(numericTaskId) as Promise<{ schedule_entries: ScheduleEntry[] }>,
      ]);
      setPlan(planResponse);
      setEntries(scheduleResponse.schedule_entries || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTask(); }, [numericTaskId]);
  const currentStatus = statusOptions.find((o) => o.value === status) || statusOptions[0];
  const totalScheduledHours = useMemo(() => entries.reduce((sum, e) => sum + e.planned_effort_hours, 0), [entries]);

  const handleSave = async () => {
    if (!task) return;
    try {
      await tasksApi.updateStatus(task.task_id, { status });
      setTask({ ...task, status });
      toast.success('Task status updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update task');
    }
  };

  const handleAutoReschedule = async () => {
    if (!task) return;
    try {
      const payload = await tasksApi.autoReschedule(task.task_id) as { created_count: number };
      toast.success(payload.created_count ? `Rescheduled ${payload.created_count} unfinished session(s)` : 'No unfinished past sessions to reschedule');
      loadTask();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to auto-reschedule task');
    }
  };

  if (loading) return <AppLayout><div className="py-20 text-center text-muted-foreground">Loading task...</div></AppLayout>;
  if (!task) return <AppLayout><div className="py-20 text-center text-muted-foreground">Task not found.</div></AppLayout>;

  return <AppLayout><div className="space-y-6 max-w-2xl mx-auto"><div className="flex items-center justify-between flex-wrap gap-2"><Button variant="ghost" onClick={() => navigate(plan ? `/plans/${plan.plan_id}` : '/plans')} className="gap-1.5"><ArrowLeft className="h-4 w-4" />Back to Plan</Button><div className="flex gap-2"><Button variant="outline" onClick={handleAutoReschedule} className="gap-1.5"><RefreshCw className="h-4 w-4" />Auto-reschedule</Button><Button onClick={handleSave} className="gap-1.5"><Save className="h-4 w-4" />Save</Button></div></div><div><h1 className="font-display text-2xl font-bold">{task.title}</h1>{plan && <p className="text-sm text-muted-foreground mt-1">{plan.title}</p>}</div><Card><CardContent className="pt-5 pb-5 space-y-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Target className="h-4 w-4 text-accent" /><span className="text-sm font-medium">Task Progress</span></div><Badge variant="secondary" className={statusBadgeClass[status]}>{currentStatus.label}</Badge></div><Progress value={currentStatus.progress} className="h-3" /><p className="text-xs text-muted-foreground text-right">{currentStatus.progress}% complete</p></CardContent></Card><div className="grid gap-4 grid-cols-1 sm:grid-cols-2"><Card><CardContent className="pt-5 pb-4 flex items-center gap-3"><CalendarDays className="h-5 w-5 text-accent" /><div><p className="text-xs text-muted-foreground">Deadline</p><p className="text-sm font-medium">{task.due_date}</p></div></CardContent></Card><Card><CardContent className="pt-5 pb-4 flex items-center gap-3"><Clock className="h-5 w-5 text-accent" /><div><p className="text-xs text-muted-foreground">Estimated Effort</p><p className="text-sm font-medium">{task.estimated_effort_hours} hours</p></div></CardContent></Card></div><Card><CardContent className="pt-5 pb-4"><p className="text-xs text-muted-foreground mb-2">Status</p><Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent>{statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></CardContent></Card><section aria-label="Scheduled work entries"><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Scheduled Work</h2>{totalScheduledHours > 0 && <span className="text-xs text-muted-foreground">{totalScheduledHours} / {task.estimated_effort_hours} hours scheduled</span>}</div><Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/50"><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Hours</th><th className="px-4 py-3 text-left">Note</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.entry_id} className="border-b last:border-0"><td className="px-4 py-3">{entry.scheduled_date}</td><td className="px-4 py-3">{entry.planned_effort_hours}</td><td className="px-4 py-3">{entry.is_rescheduled ? <Badge variant="secondary" className="bg-warning/10 text-warning gap-1"><RefreshCw className="h-3 w-3" />Rescheduled</Badge> : <span className="text-muted-foreground">—</span>}</td></tr>)}{entries.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No scheduled entries yet.</td></tr>}</tbody></table></div></CardContent></Card></section></div></AppLayout>;
};

export default TaskDetailPage;
