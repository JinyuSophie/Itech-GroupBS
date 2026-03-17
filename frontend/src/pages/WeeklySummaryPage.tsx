import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { summaryApi, scheduleApi } from "@/services/api";
import { CheckCircle2, Clock, BarChart3, TrendingUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const WeeklySummaryPage = () => {
  const [data, setData] = useState<{ week_start: string; week_end: string; tasks_completed: number; total_effort_hours: number; remaining_workload_hours: number; plans_progress: any[] }>({ week_start: '', week_end: '', tasks_completed: 0, total_effort_hours: 0, remaining_workload_hours: 0, plans_progress: [] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const payload = await summaryApi.weekly();
      setData(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load weekly summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAutoReschedule = async () => {
    try {
      const payload = await scheduleApi.autoReschedule();
      toast.success(payload.created_count ? `Rescheduled ${payload.created_count} unfinished session(s)` : 'No unfinished past sessions to reschedule');
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to auto-reschedule');
    }
  };

  return <AppLayout><div className="space-y-6 max-w-4xl mx-auto"><div className="flex items-start justify-between gap-3 flex-wrap"><div><h1 className="font-display text-2xl font-bold text-foreground">Weekly Summary</h1><p className="text-sm text-muted-foreground">{data.week_start || '—'} — {data.week_end || '—'}</p></div><Button variant="outline" onClick={handleAutoReschedule} className="gap-1.5"><RefreshCw className="h-4 w-4" />Auto-reschedule unfinished work</Button></div><section aria-label="Weekly statistics"><div className="grid gap-4 grid-cols-1 sm:grid-cols-3"><Card><CardContent className="pt-5 pb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></div><div><p className="text-2xl font-bold">{data.tasks_completed}</p><p className="text-xs text-muted-foreground">Tasks Completed</p></div></CardContent></Card><Card><CardContent className="pt-5 pb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10"><Clock className="h-5 w-5 text-info" /></div><div><p className="text-2xl font-bold">{data.total_effort_hours}</p><p className="text-xs text-muted-foreground">Hours Logged</p></div></CardContent></Card><Card><CardContent className="pt-5 pb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><BarChart3 className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">{data.remaining_workload_hours}</p><p className="text-xs text-muted-foreground">Hours Remaining</p></div></CardContent></Card></div></section><section aria-label="Per-plan progress"><h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2"><TrendingUp className="h-5 w-5 text-accent" />Plan Progress</h2><div className="space-y-4">{data.plans_progress.map((item) => <Card key={item.plan.plan_id}><CardContent className="pt-5 pb-4 space-y-2"><div className="flex items-center justify-between"><div><p className="font-medium text-foreground">{item.plan.title}</p><p className="text-xs text-muted-foreground">{item.plan.start_date} → {item.plan.end_date}</p></div><span className="text-sm font-semibold">{item.progress_percent}%</span></div><Progress value={item.progress_percent} className="h-2" /></CardContent></Card>)}{!loading && data.plans_progress.length === 0 && <p className="text-sm text-muted-foreground">No summary data yet.</p>}</div></section></div></AppLayout>;
};

export default WeeklySummaryPage;
