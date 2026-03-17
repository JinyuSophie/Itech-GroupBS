import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { scheduleApi } from "@/services/api";
import { CalendarDays, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const formatHeading = (dateString: string) => {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
};

const WeeklySchedulePage = () => {
  const [data, setData] = useState<{ week_start: string; week_end: string; days: any[] }>({ week_start: '', week_end: '', days: [] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const payload = await scheduleApi.weekly();
      setData(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load weekly schedule');
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

  return <AppLayout><div className="space-y-6"><div className="flex items-start justify-between gap-3 flex-wrap"><div><h1 className="font-display text-2xl font-bold text-foreground">Weekly Schedule</h1><p className="text-sm text-muted-foreground">Current week: {data.week_start || '—'} to {data.week_end || '—'}</p></div><Button variant="outline" onClick={handleAutoReschedule} className="gap-1.5"><RefreshCw className="h-4 w-4" />Auto-reschedule unfinished work</Button></div><section aria-label="Weekly schedule by day"><div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{data.days.map((day) => <Card key={day.date} className="overflow-hidden"><div className="px-4 py-3 border-b bg-muted/50"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-accent" /><span className="font-semibold text-foreground">{formatHeading(day.date)}</span></div><span className="text-xs text-muted-foreground">{day.total_hours}h</span></div></div><CardContent className="p-4 space-y-3">{day.entries.length === 0 ? <p className="text-sm text-muted-foreground">No planned work.</p> : day.entries.map((entry: any) => <div key={entry.entry_id} className="rounded-lg border p-3 space-y-1"><div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{entry.task_title}</span><span className="text-xs text-accent">{entry.planned_effort_hours}h</span></div><p className="text-xs text-muted-foreground">{entry.plan_title}</p>{entry.is_rescheduled && <Badge variant="secondary" className="bg-warning/10 text-warning gap-1"><RefreshCw className="h-3 w-3" />Rescheduled</Badge>}</div>)}</CardContent></Card>)}{!loading && data.days.length === 0 && <p className="text-sm text-muted-foreground">No weekly schedule data available.</p>}</div></section></div></AppLayout>;
};

export default WeeklySchedulePage;
