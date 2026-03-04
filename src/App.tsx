/**
 * App.tsx — Root application component.
 *
 * This file sets up:
 * 1. React Query (TanStack Query) for server-state caching when the backend is connected.
 * 2. UI providers (Tooltip, Toasters) for global toast notifications and tooltips.
 * 3. React Router with protected routes that require authentication.
 * 4. The AuthProvider context wrapping all routes so any page can access user state.
 *
 * ROUTING STRUCTURE:
 *   /                → Login/Register page (redirects to /dashboard if already logged in)
 *   /dashboard       → Dashboard overview (protected)
 *   /plans           → List of study plans (protected)
 *   /plans/:planId   → Single plan detail with its tasks (protected)
 *   /tasks/:taskId   → Single task detail with progress and schedule (protected)
 *   /schedule        → Weekly schedule grid view (protected)
 *   /schedule/summary → Weekly summary with stats (protected)
 *   *                → 404 Not Found page
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PlansListPage from "./pages/PlansListPage";
import PlanDetailPage from "./pages/PlanDetailPage";
import TaskDetailPage from "./pages/TaskDetailPage";
import WeeklySchedulePage from "./pages/WeeklySchedulePage";
import WeeklySummaryPage from "./pages/WeeklySummaryPage";
import NotFound from "./pages/NotFound";

/**
 * React Query client instance.
 * Manages caching, refetching, and synchronisation of server state.
 * Currently unused (mock data), but ready for when API calls are added.
 */
const queryClient = new QueryClient();

/**
 * ProtectedRoute — Wrapper that redirects unauthenticated users to login.
 * Uses the isAuthenticated flag from AuthContext to decide.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  // If not logged in, redirect to the root (login page)
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * AppRoutes — Defines all application routes.
 * Separated from App so it can access AuthContext (which is provided by App).
 */
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public route: show login if not authenticated, redirect to dashboard if already logged in */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      {/* Protected routes — user must be logged in to access these */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/plans" element={<ProtectedRoute><PlansListPage /></ProtectedRoute>} />
      <Route path="/plans/:planId" element={<ProtectedRoute><PlanDetailPage /></ProtectedRoute>} />
      <Route path="/tasks/:taskId" element={<ProtectedRoute><TaskDetailPage /></ProtectedRoute>} />
      <Route path="/schedule" element={<ProtectedRoute><WeeklySchedulePage /></ProtectedRoute>} />
      <Route path="/schedule/summary" element={<ProtectedRoute><WeeklySummaryPage /></ProtectedRoute>} />

      {/* Catch-all for unknown routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

/**
 * App — Top-level component that wraps everything with providers.
 *
 * Provider hierarchy (outermost → innermost):
 *   QueryClientProvider → TooltipProvider → Toasters → BrowserRouter → AuthProvider → Routes
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* Radix-based toaster (for useToast hook) */}
      <Toaster />
      {/* Sonner toaster (for toast() function from sonner) */}
      <Sonner />
      <BrowserRouter>
        {/* AuthProvider must be inside BrowserRouter so it can use router hooks */}
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
