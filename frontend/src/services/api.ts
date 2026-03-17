const defaultApiBase = (() => {
  if (typeof window === "undefined") return "http://127.0.0.1:8000/api";

  const host = window.location.hostname;
  const isLocalhost = host === "localhost" || host === "127.0.0.1";

  // Local development: Django usually runs on :8000.
  if (isLocalhost) return `${window.location.protocol}//${host}:8000/api`;

  // Production deployments should stay configurable via Vite env vars so the frontend
  // can target either a proxied `/api` path or a separately hosted Django service.
  return "/api";
})();

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || defaultApiBase;

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = Number(import.meta.env.VITE_API_TIMEOUT_MS || 7000);
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    // Centralising fetch concerns here keeps page components focused on user workflows
    // rather than transport details such as cookies, timeouts, and error parsing.
    res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      credentials: "include",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms.`);
    }
    throw new Error("Cannot connect to the backend server.");
  } finally {
    globalThis.clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const text = await res.text();
    let detail = res.statusText || "Request failed";
    try {
      const parsed = JSON.parse(text);
      detail = parsed.detail || parsed.error || text || detail;
    } catch {
      detail = text || detail;
    }
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const healthApi = {
  get: () => request<{ status: string }>("/health/"),
};

export const authApi = {
  register: (data: { email: string; password: string; confirm_password: string }) =>
    request<{ user: { user_id: number; email: string; created_at: string } }>("/auth/register/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    request<{ user: { user_id: number; email: string; created_at: string } }>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  logout: () => request<{ logged_out: boolean }>("/auth/logout/", { method: "POST" }),
  session: () => request<{ user: { user_id: number; email: string; created_at: string } }>("/auth/session/"),
};

export const plansApi = {
  list: async () => {
    const payload = await request<{ plans: any[] } | any[]>("/plans/");
    return Array.isArray(payload) ? payload : payload.plans;
  },
  create: (data: { title: string; start_date: string; end_date: string }) =>
    request("/plans/", { method: "POST", body: JSON.stringify(data) }),
  get: (id: number) => request(`/plans/${id}/`),
  update: (id: number, data: { title?: string; start_date?: string; end_date?: string }) =>
    request(`/plans/${id}/`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => request(`/plans/${id}/`, { method: "DELETE" }),
  getTasks: (id: number) => request<{ plan: any; tasks: any[] }>(`/plans/${id}/tasks/`),
};

export const tasksApi = {
  create: (data: { plan_id: number; title: string; deadline_date: string; estimated_effort_hours: number; status?: string }) =>
    request("/tasks/", { method: "POST", body: JSON.stringify(data) }),
  get: (id: number) => request(`/tasks/${id}/`),
  update: (id: number, data: { title?: string; status?: string; due_date?: string; estimated_effort_hours?: number }) =>
    request(`/tasks/${id}/`, { method: "PUT", body: JSON.stringify(data) }),
  updateStatus: (id: number, data: { status: string }) =>
    request(`/tasks/${id}/status/`, { method: "POST", body: JSON.stringify(data) }),
  delete: (id: number) => request(`/tasks/${id}/`, { method: "DELETE" }),
  getScheduleEntries: (id: number) => request<{ task: any; schedule_entries: any[] }>(`/tasks/${id}/schedule-entries/`),
  autoReschedule: (id: number) => request<{ created_count: number; rescheduled_entries: any[] }>(`/tasks/${id}/auto-reschedule/`, { method: "POST" }),
};

export const dashboardApi = {
  get: () => request("/dashboard/"),
};

export const scheduleApi = {
  weekly: () => request<{ week_start: string; week_end: string; days: any[] }>("/schedule/weekly/"),
  autoReschedule: () => request<{ created_count: number; rescheduled_entries: any[] }>("/schedule/auto-reschedule/", { method: "POST" }),
};

export const summaryApi = {
  weekly: () => request<{ week_start: string; week_end: string; tasks_completed: number; total_effort_hours: number; remaining_workload_hours: number; plans_progress: any[] }>("/summary/weekly/"),
};
