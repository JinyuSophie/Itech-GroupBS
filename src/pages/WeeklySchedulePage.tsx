/**
 * WeeklySchedulePage.tsx — Weekly schedule grid view (Wireframe 5).
 *
 * Displays schedule entries grouped by date as day-cards.
 * Each card shows:
 *   - Day name and date in the header.
 *   - List of tasks with their allocated hours.
 *   - "Rescheduled" badge for moved entries.
 *   - Total hours in the footer.
 *
 * BACKEND INTEGRATION:
 *   Replace getWeekEntries() with:
 *     const { data } = useQuery({ queryKey: ["schedule"], queryFn: scheduleApi.weekly });
 *   The backend should return entries grouped by date or the frontend can group them.
 *
 * MOBILE:
 *   - Cards stack in single column on mobile (grid-cols-1).
 *   - 2 columns on tablet, 3-4 on desktop.
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
 * Returns a Record<string, ScheduleEntry[]> where the key is the date string.
 * This simulates what the backend's GET /api/schedule/weekly would return.
 *
 * TODO: Replace with a direct API call that returns grouped data.
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
  // Group entries by date and sort chronologically
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
        {/* Responsive: 1 col mobile → 2 cols tablet → 3-4 cols desktop */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedDates.map((date) => {
            const entries = weekEntries[date];
            // Calculate total planned hours for this day
            const totalHours = entries.reduce((s, e) => s + e.planned_effort_hours, 0);
            // Convert date string to day-of-week name
            const d = new Date(date);
            const dayName = daysOfWeek[d.getDay() === 0 ? 6 : d.getDay() - 1];

            return (
              <Card key={date} className="overflow-hidden">
                {/* ── Day Header ── */}
                {/* Primary-coloured header strip with day name and date */}
                <div className="bg-primary px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary-foreground">{dayName}</span>
                  <span className="text-xs text-primary-foreground/70">{date}</span>
                </div>

                {/* ── Entry List ── */}
                {/* Each entry shows task title, plan name, hours, and reschedule badge */}
                <CardContent className="p-0 divide-y divide-border">
                  {entries.map((entry) => {
                    // Look up the task and its parent plan for display
                    const task = mockTasks.find((t) => t.task_id === entry.task);
                    const plan = task ? mockPlans.find((p) => p.plan_id === task.plan) : null;
                    return (
                      <div key={entry.entry_id} className="px-4 py-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{task?.title || "Task"}</span>
                          {/* Hours badge */}
                          <span className="text-xs font-medium text-accent">{entry.planned_effort_hours}h</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{plan?.title}</span>
                          {/* Rescheduled indicator — shown when entry was moved */}
                          {entry.is_rescheduled && (
                            <Badge variant="secondary" className="bg-warning/10 text-warning text-[10px] gap-0.5 px-1.5 py-0">
                              <RefreshCw className="h-2.5 w-2.5" /> moved
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>

                {/* ── Day Footer — Total Hours ── */}
                <div className="border-t bg-muted/50 px-4 py-2 text-xs text-muted-foreground text-right">
                  Total: <span className="font-medium text-foreground">{totalHours}h</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default WeeklySchedulePage;
