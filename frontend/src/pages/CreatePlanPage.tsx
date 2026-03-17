import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
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
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !startDate || !endDate) return setError('Please fill in all fields.');
    if (new Date(endDate) < new Date(startDate)) return setError('End date must be on or after start date.');
    try {
      await plansApi.create({ title, start_date: startDate, end_date: endDate });
      toast.success('Study plan created');
      navigate('/plans');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create plan');
    }
  };

  return <AppLayout><div className="space-y-6 max-w-lg mx-auto"><Button variant="ghost" onClick={() => navigate('/plans')} className="gap-1.5"><ArrowLeft className="h-4 w-4" />Back to Plans</Button><h1 className="font-display text-2xl font-bold">Create Study Plan</h1><Card><CardContent className="pt-6"><form onSubmit={handleSubmit} className="space-y-4"><div className="space-y-2"><Label htmlFor="plan-title">Plan Title</Label><Input id="plan-title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="start-date">Start Date</Label><Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="end-date">End Date</Label><Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div></div>{error && <p className="text-sm text-destructive" role="alert">{error}</p>}<Button type="submit" className="w-full gap-1.5"><Save className="h-4 w-4" />Create Plan</Button></form></CardContent></Card></div></AppLayout>;
};

export default CreatePlanPage;
