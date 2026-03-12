import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { plansApi } from "@/services/api";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const CreatePlanPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) {
      toast.error("Please complete all fields");
      return;
    }

    setSaving(true);
    try {
      const plan = await plansApi.create({ title, start_date: startDate, end_date: endDate }) as { plan_id: number };
      toast.success("Plan created");
      navigate(`/plans/${plan.plan_id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
        <Button variant="ghost" className="gap-1.5" onClick={() => navigate("/plans")}>
          <ArrowLeft className="h-4 w-4" /> Back to Plans
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Create Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="title">Plan Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Web Development Revision" />
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
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CreatePlanPage;
