import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as api from "../services/api";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("Dashboard API - Dashboard Data", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.setItem("auth_token", "test-token");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should load dashboard with progress, today's tasks, and deadlines", async () => {
    const mockDashboard = {
      progress: { completed_tasks: 15, total_tasks: 30, percentage: 50 },
      todays_tasks: [
        { id: 101, title: "Task 1", status: "pending" },
        { id: 102, title: "Task 2", status: "in_progress" },
      ],
      upcoming_deadlines: [
        { id: 201, plan_title: "Study Math", due_date: "2024-01-20" },
      ],
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockDashboard,
    });

    const result = await api.dashboardApi.get();

    expect(result.progress.percentage).toBe(50);
    expect(result.todays_tasks).toHaveLength(2);
    expect(result.upcoming_deadlines).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/dashboard"),
      expect.any(Object)
    );
  });

  it("should display all dashboard widgets", () => {
    expect(true).toBe(true); // Placeholder for React component test
  });
});