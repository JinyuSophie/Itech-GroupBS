import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { plansApi, tasksApi } from "@/services/api";
import type { StudyPlan, TaskStatus } from "@/types/models";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const CreateTaskPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetPlanId = searchParams.get("plan") || "";

  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [planId, setPlanId] = useState(presetPlanId);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [effort, setEffort] = useState("2");
  const [status, setStatus] = useState<TaskStatus>("not_started");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = (await plansApi.list()) as StudyPlan[];
        setPlans(response);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load plans");
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId || !title || !deadline || !effort) {
      toast.error("Please complete all fields");
      return;
    }

    setSaving(true);
    try {
      const task = await tasksApi.create({
        plan_id: Number(planId),
        title,
        deadline_date: deadline,
        estimated_effort_hours: Number(effort),
        status,
      }) as { task_id: number };
      toast.success("Task created");
      navigate(`/tasks/${task.task_id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
        <Button variant="ghost" className="gap-1.5" onClick={() => navigate(planId ? `/plans/${planId}` : "/plans") }>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Create Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="plan">Study Plan</Label>
                <Select value={planId} onValueChange={setPlanId}>
                  <SelectTrigger id="plan"><SelectValue placeholder="Select a plan" /></SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => <SelectItem key={plan.plan_id} value={String(plan.plan_id)}>{plan.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="effort">Estimated Effort Hours</Label>
                  <Input id="effort" type="number" min="0.5" step="0.5" value={effort} onChange={(e) => setEffort(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button type="submit" className="gap-1.5" disabled={saving}>
                  <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CreateTaskPage;
