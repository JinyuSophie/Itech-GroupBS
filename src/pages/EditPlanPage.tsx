import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { plansApi } from "@/services/api";
import type { StudyPlan } from "@/types/models";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const EditPlanPage = () => {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();
  const numericPlanId = Number(planId);

  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = (await plansApi.get(numericPlanId)) as StudyPlan;
        setPlan(response);
        setTitle(response.title);
        setStartDate(response.start_date);
        setEndDate(response.end_date);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load plan");
      } finally {
        setLoading(false);
      }
    };

    if (numericPlanId) {
      load();
    } else {
      setLoading(false);
    }
  }, [numericPlanId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;
    setSaving(true);
    try {
      await plansApi.update(plan.plan_id, { title, start_date: startDate, end_date: endDate });
      toast.success("Plan updated");
      navigate(`/plans/${plan.plan_id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
        <Button variant="ghost" className="gap-1.5" onClick={() => navigate(plan ? `/plans/${plan.plan_id}` : "/plans") }>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Edit Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading plan...</div>
            ) : !plan ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Plan not found.</div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="title">Plan Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" className="gap-1.5" disabled={saving}>
                    <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default EditPlanPage;
