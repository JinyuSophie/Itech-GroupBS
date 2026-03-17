import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { plansApi } from "@/services/api";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const EditPlanPage = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const numericPlanId = Number(planId);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!numericPlanId) return;
    plansApi.get(numericPlanId).then((plan: any) => { setTitle(plan.title); setStartDate(plan.start_date); setEndDate(plan.end_date); }).catch((error) => setError(error.message || 'Failed to load plan'));
  }, [numericPlanId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !startDate || !endDate) return setError('Please fill in all fields.');
    if (new Date(endDate) < new Date(startDate)) return setError('End date must be on or after start date.');
    try {
      await plansApi.update(numericPlanId, { title, start_date: startDate, end_date: endDate });
      toast.success('Plan updated');
      navigate(`/plans/${numericPlanId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update plan');
    }
  };

  return <AppLayout><div className="space-y-6 max-w-lg mx-auto"><Button variant="ghost" onClick={() => navigate(`/plans/${numericPlanId}`)} className="gap-1.5"><ArrowLeft className="h-4 w-4" />Back to Plan</Button><h1 className="font-display text-2xl font-bold">Edit Plan</h1><Card><CardContent className="pt-6"><form onSubmit={handleSave} className="space-y-4"><div className="space-y-2"><Label htmlFor="edit-title">Plan Title</Label><Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="edit-start">Start Date</Label><Input id="edit-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="edit-end">End Date</Label><Input id="edit-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div></div>{error && <p className="text-sm text-destructive" role="alert">{error}</p>}<Button type="submit" className="w-full gap-1.5"><Save className="h-4 w-4" />Save Changes</Button></form></CardContent></Card></div></AppLayout>;
};

export default EditPlanPage;
