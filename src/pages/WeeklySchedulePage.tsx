/**
 * WeeklySchedulePage.tsx — Weekly schedule grid view (Wireframe 5).
 *
 * ACCESSIBILITY (WCAG):
 *   - 1.4.3 Contrast: "Moved" badge uses icon + text + colour (not colour alone).
 *   - 2.1.1 Keyboard: All elements are in natural tab order.
 *   - Tables/cards use semantic HTML for screen reader navigation.
 *   - Section uses aria-label for landmark identification.
 */

import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockScheduleEntries, mockTasks, mockPlans } from "@/services/mockData";
import { RefreshCw } from "lucide-react";

// Days of the week labels (Monday-first, matching ISO week standard)
const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * getWeekEntries — Groups schedule entries by their scheduled_date.
 *
 * Returns a Record<string, ScheduleEntry[]> where key is the date string.
 */
const getWeekEntries = () => {
  const grouped: Record<string, typeof mockScheduleEntries> = {};
  mockScheduleEntries.forEach((entry) => {
    if (!grouped[entry.scheduled_date]) grouped[entry.scheduled_date] = [];
    grouped[entry.scheduled_date].push(entry);
  });
  return grouped;
};

const WeeklySchedulePage = () => {
  const weekEntries = getWeekEntries();
  const sortedDates = Object.keys(weekEntries).sort();

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        {/* ── Page Header ── */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Weekly Schedule</h1>
          <p className="text-sm text-muted-foreground">Your planned study sessions this week</p>
        </div>
        {/* ── Day Cards Grid ── */}
        <section aria-label="Weekly schedule by day">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedDates.map((date) => {
              const entries = weekEntries[date];
              const totalHours = entries.reduce((s, e) => s + e.planned_effort_hours, 0);
              const d = new Date(date);
              const dayName = daysOfWeek[d.getDay() === 0 ? 6 : d.getDay() - 1];



              return (
                <Card key={date} className="overflow-hidden">
                  {/* Day Header */}
                  <div className="bg-primary px-4 py-2.5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary-foreground">{dayName}</span>
                    <span className="text-xs text-primary-foreground/70">{date}</span>
                  </div>


                  {/* Entry List */}
                  <CardContent className="p-0 divide-y divide-border">
                    {entries.map((entry) => {
                      const task = mockTasks.find((t) => t.task_id === entry.task);
                      const plan = task ? mockPlans.find((p) => p.plan_id === task.plan) : null;
                      return (
                        <div key={entry.entry_id} className="px-4 py-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{task?.title || "Task"}</span>
                            <span className="text-xs font-medium text-accent">{entry.planned_effort_hours}h</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{plan?.title}</span>
                            {/* Rescheduled indicator — icon + text (1.4.3) */}
                            {entry.is_rescheduled && (
                              <Badge variant="secondary" className="bg-warning/10 text-warning text-[10px] gap-0.5 px-1.5 py-0">
                                <RefreshCw className="h-2.5 w-2.5" aria-hidden="true" /> moved
                              </Badge>
                            )}
                          </div>


                        </div>
                      );
                    })}
                  </CardContent>


                  {/* Day Footer — Total Hours */}
                  <div className="border-t bg-muted/50 px-4 py-2 text-xs text-muted-foreground text-right">
                    Total: <span className="font-medium text-foreground">{totalHours}h</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default WeeklySchedulePage;
