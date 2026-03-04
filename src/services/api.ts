/**
 * API helper functions used by the frontend to communicate with the backend server.
 *
 * CONNECT TO DJANGO:
 * 1. Change BASE_URL below to your Django server address
 *    (e.g. "http://localhost:8000/api" for local dev).
 * 2. Ensure Django returns JSON responses matching the TypeScript
 *    interfaces defined in src/types/models.ts.
 * 3. The token stored in localStorage ("auth_token") is sent as
 *    "Authorization: Token <token>" on every authenticated request.
 *    This matches Django REST Framework's TokenAuthentication.
 *
 * CORS: Make sure django-cors-headers is configured to allow
 * requests from the front-end origin (e.g. http://localhost:5173).
 */

// ─── Configuration ─────────────────────────────────────────────────────────────

/**
 * Base URL for all API calls.
 * Change this to point to the Django backend when it's ready.
 * Example: "http://localhost:8000/api"
 */
const BASE_URL = "/api";

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Builds the default headers for every request.
 * - Always sends JSON content type.
 * - Attaches the auth token if the user is logged in.
 *   The token is stored in localStorage by AuthContext after login/register.
 */
function getHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const token = localStorage.getItem("auth_token");
  if (token) {
    // Django REST Framework expects "Token <key>" format
    headers["Authorization"] = `Token ${token}`;
  }
  return headers;
}

/**
 * Generic request wrapper that:
 * 1. Prepends BASE_URL to the endpoint path.
 * 2. Merges default headers with any request-specific headers.
 * 3. Parses JSON response or throws an Error with the server's detail message.
 *
 * @template T - The expected response type (auto-inferred at call site).
 * @param endpoint - API path, e.g. "/plans" or "/tasks/5".
 * @param options  - Standard fetch RequestInit overrides (method, body, etc.).
 */
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });

  // If the response is not OK (status 4xx/5xx), try to extract the error detail
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "Request failed");
  }

  return res.json();
}

// ─── Auth Endpoints ────────────────────────────────────────────────────────────
// Maps to Django URLs: /api/auth/register, /api/auth/login, etc.

export const authApi = {
  /** POST /api/auth/register — Create a new user account */
  register: (data: { email: string; password: string; confirm_password: string }) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  /** POST /api/auth/login — Authenticate and receive a token */
  login: (data: { email: string; password: string }) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  /** POST /api/auth/logout — Invalidate the current token */
  logout: () => request("/auth/logout", { method: "POST" }),

  /** GET /api/auth/session — Check current session validity */
  session: () => request("/auth/session"),
};

// ─── Plans Endpoints ───────────────────────────────────────────────────────────
// Maps to Django URLs: /api/plans/ (list/create), /api/plans/<id>/ (detail)

export const plansApi = {
  /** GET /api/plans — Retrieve all plans for the authenticated user */
  list: () => request("/plans"),

  /** POST /api/plans — Create a new study plan */
  create: (data: { title: string; start_date: string; end_date: string }) =>
    request("/plans", { method: "POST", body: JSON.stringify(data) }),

  /** GET /api/plans/<id> — Retrieve a single plan by ID */
  get: (id: number) => request(`/plans/${id}`),

  /** PUT /api/plans/<id> — Update plan fields (title, dates) */
  update: (id: number, data: Partial<{ title: string; start_date: string; end_date: string }>) =>
    request(`/plans/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  /** DELETE /api/plans/<id> — Remove a plan and its related tasks */
  delete: (id: number) => request(`/plans/${id}`, { method: "DELETE" }),
};

// ─── Tasks Endpoints ───────────────────────────────────────────────────────────
// Maps to Django URLs: /api/tasks/ (create), /api/tasks/<id>/ (detail)

export const tasksApi = {
  /** POST /api/tasks — Create a task under a specific plan */
  create: (data: { plan: number; title: string; due_date: string; estimated_effort_hours: number }) =>
    request("/tasks", { method: "POST", body: JSON.stringify(data) }),

  /** GET /api/tasks/<id> — Retrieve a single task */
  get: (id: number) => request(`/tasks/${id}`),

  /** PUT /api/tasks/<id> — Update task fields (title, status, due_date, effort) */
  update: (id: number, data: Partial<{ title: string; status: string; due_date: string; estimated_effort_hours: number }>) =>
    request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  /** DELETE /api/tasks/<id> — Remove a task */
  delete: (id: number) => request(`/tasks/${id}`, { method: "DELETE" }),
};

// ─── Schedule Endpoints ────────────────────────────────────────────────────────

export const scheduleApi = {
  /** GET /api/schedule/weekly — Get this week's schedule entries */
  weekly: () => request("/schedule/weekly"),
};

// ─── Dashboard Endpoint ────────────────────────────────────────────────────────

export const dashboardApi = {
  /** GET /api/dashboard — Aggregated dashboard data (progress, today's tasks, deadlines) */
  get: () => request("/dashboard"),
};

// ─── Summary Endpoint ──────────────────────────────────────────────────────────

export const summaryApi = {
  /** GET /api/summary/weekly — Weekly productivity summary */
  weekly: () => request("/summary/weekly"),
};
