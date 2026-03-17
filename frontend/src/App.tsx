import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PlansListPage from "./pages/PlansListPage";
import CreatePlanPage from "./pages/CreatePlanPage";
import PlanDetailPage from "./pages/PlanDetailPage";
import EditPlanPage from "./pages/EditPlanPage";
import CreateTaskPage from "./pages/CreateTaskPage";
import TaskDetailPage from "./pages/TaskDetailPage";
import WeeklySchedulePage from "./pages/WeeklySchedulePage";
import WeeklySummaryPage from "./pages/WeeklySummaryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/plans" element={<ProtectedRoute><PlansListPage /></ProtectedRoute>} />
      <Route path="/plans/new" element={<ProtectedRoute><CreatePlanPage /></ProtectedRoute>} />
      <Route path="/plans/:planId" element={<ProtectedRoute><PlanDetailPage /></ProtectedRoute>} />
      <Route path="/plans/:planId/edit" element={<ProtectedRoute><EditPlanPage /></ProtectedRoute>} />
      <Route path="/tasks/new" element={<ProtectedRoute><CreateTaskPage /></ProtectedRoute>} />
      <Route path="/tasks/:taskId" element={<ProtectedRoute><TaskDetailPage /></ProtectedRoute>} />
      <Route path="/schedule/week" element={<ProtectedRoute><WeeklySchedulePage /></ProtectedRoute>} />
      <Route path="/summary/week" element={<ProtectedRoute><WeeklySummaryPage /></ProtectedRoute>} />
      <Route path="/schedule" element={<Navigate to="/schedule/week" replace />} />
      <Route path="/schedule/summary" element={<Navigate to="/summary/week" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
