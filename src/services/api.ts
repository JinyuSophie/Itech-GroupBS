const BASE_URL = "http://127.0.0.1:8000/api";

function getHeaders(): HeadersInit {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Token ${token}` } : {}),
  };
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "Request failed");
  }

  return res.json();
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

  getTasks: (id: number) => request(`/plans/${id}/tasks/`),
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

  update: (id: number, data: { title?: string; status?: string; due_date?: string }) =>
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
};

export const dashboardApi = {
  get: () => request("/dashboard"),
};

export const scheduleApi = {
  weekly: () => request("/schedule/weekly"),
};

export const summaryApi = {
  weekly: () => request("/summary/weekly"),
};
