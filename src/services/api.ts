const BASE_URL = "http://127.0.0.1:8000/api";

function getHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
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

export const plansApi = {
  list: () => request<{ plans: any[] }>("/plans/"),

  create: (data: { title: string; start_date: string; end_date: string }) =>
    request("/plans/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  get: (id: number) => request(`/plans/${id}/`),

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