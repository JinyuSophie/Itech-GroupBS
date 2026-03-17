const defaultApiBase =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000/api`
    : "http://127.0.0.1:8000/api";

export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || defaultApiBase;

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
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

  logout: () =>
    request<{ logged_out: boolean }>("/auth/logout/", {
      method: "POST",
    }),

  session: () => request<{ user: { user_id: number; email: string; created_at: string } }>("/auth/session/"),
};

export const plansApi = {
  list: async () => {
    const payload = await request<{ plans: any[] } | any[]>("/plans/");
    return Array.isArray(payload) ? payload : payload.plans;
  },

  create: (data: { title: string; start_date: string; end_date: string }) =>
    request("/plans/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  get: (id: number) => request(`/plans/${id}/`),

  update: (id: number, data: { title?: string; start_date?: string; end_date?: string }) =>
    request(`/plans/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request(`/plans/${id}/`, {
      method: "DELETE",
    }),

  getTasks: (id: number) => request<{ plan: any; tasks: any[] }>(`/plans/${id}/tasks/`),
};

export const tasksApi = {
  create: (data: {
    plan_id: number;
    title: string;
    deadline_date: string;
    estimated_effort_hours: number;
    status?: string;
  }) =>
    request("/tasks/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  get: (id: number) => request(`/tasks/${id}/`),

  update: (
    id: number,
    data: { title?: string; status?: string; due_date?: string; estimated_effort_hours?: number },
  ) =>
    request(`/tasks/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateStatus: (id: number, data: { status: string }) =>
    request(`/tasks/${id}/status/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request(`/tasks/${id}/`, {
      method: "DELETE",
    }),

  getScheduleEntries: (id: number) => request<{ task: any; schedule_entries: any[] }>(`/tasks/${id}/schedule-entries/`),
  createScheduleEntry: (id: number, data: { scheduled_date: string; planned_effort_hours: number; is_rescheduled?: boolean }) =>
    request(`/tasks/${id}/schedule-entries/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const scheduleEntriesApi = {
  get: (id: number) => request(`/schedule-entries/${id}/`),
  update: (id: number, data: { scheduled_date?: string; planned_effort_hours?: number; is_rescheduled?: boolean }) =>
    request(`/schedule-entries/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request(`/schedule-entries/${id}/`, {
      method: "DELETE",
    }),
  getProgressLogs: (id: number) => request<{ schedule_entry: any; progress_logs: any[] }>(`/schedule-entries/${id}/progress-logs/`),
  createProgressLog: (id: number, data: { actual_effort_hours: number; completed_flag?: boolean }) =>
    request(`/schedule-entries/${id}/progress-logs/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const progressLogsApi = {
  get: (id: number) => request(`/progress-logs/${id}/`),
  update: (id: number, data: { actual_effort_hours?: number; completed_flag?: boolean }) =>
    request(`/progress-logs/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request(`/progress-logs/${id}/`, {
      method: "DELETE",
    }),
};

export const dashboardApi = {
  get: () => request("/dashboard/"),
};
