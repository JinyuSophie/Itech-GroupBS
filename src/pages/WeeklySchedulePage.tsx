import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { plansApi, tasksApi } from "@/services/api";
import type { ScheduleEntry, StudyPlan, Task } from "@/types/models";
import { CalendarRange } from "lucide-react";
import { toast } from "sonner";

type ScheduleItem = ScheduleEntry & { taskTitle: string; planTitle: string };

const weekDates = () => {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
};

const formatISODate = (date: Date) => date.toISOString().slice(0, 10);

const WeeklySchedulePage = () => {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const plans = (await plansApi.list()) as StudyPlan[];
        const taskPayloads = await Promise.all(plans.map((plan) => plansApi.getTasks(plan.plan_id) as Promise<{ tasks: Task[] }>));
        const tasks = taskPayloads.flatMap((payload) => payload.tasks || []);
        const planMap = new Map(plans.map((plan) => [plan.plan_id, plan.title]));

        const entryPayloads = await Promise.all(tasks.map((task) => tasksApi.getScheduleEntries(task.task_id) as Promise<{ schedule_entries: ScheduleEntry[] }>));
        const merged: ScheduleItem[] = tasks.flatMap((task, index) =>
          (entryPayloads[index].schedule_entries || []).map((entry) => ({
            ...entry,
            taskTitle: task.title,
            planTitle: planMap.get(task.plan) || "Plan",
          })),
        );
        setItems(merged);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load weekly schedule");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const dates = useMemo(() => weekDates(), []);
  const grouped = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    for (const date of dates) {
      map[formatISODate(date)] = [];
    }
    items.forEach((item) => {
      if (map[item.scheduled_date]) {
        map[item.scheduled_date].push(item);
      }
    });
    Object.values(map).forEach((dayItems) => dayItems.sort((a, b) => a.taskTitle.localeCompare(b.taskTitle)));
    return map;
  }, [dates, items]);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <header className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-foreground">Weekly Schedule</h1>
          <p className="text-sm text-muted-foreground">A simple week view aligned with the sitemap route and existing backend data.</p>
        </header>

        {loading ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading schedule...</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dates.map((date) => {
              const iso = formatISODate(date);
              const dayItems = grouped[iso] || [];
              return (
                <Card key={iso}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CalendarRange className="h-4 w-4 text-accent" />
                      {date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dayItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No planned work.</p>
                    ) : (
                      dayItems.map((item) => (
                        <div key={item.entry_id} className="rounded-lg border border-border bg-muted/20 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-foreground">{item.taskTitle}</p>
                              <p className="text-xs text-muted-foreground">{item.planTitle}</p>
                            </div>
                            {item.is_rescheduled && <Badge variant="secondary" className="bg-warning/10 text-warning">Rescheduled</Badge>}
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">{item.planned_effort_hours} planned hour{item.planned_effort_hours === 1 ? "" : "s"}</p>
                        </div>
                      ))
                    )}
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

export default WeeklySchedulePage;
