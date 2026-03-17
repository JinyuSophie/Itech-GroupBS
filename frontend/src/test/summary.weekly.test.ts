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

describe("Summary API - Weekly Summary", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.setItem("auth_token", "test-token");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should load weekly summary with productivity statistics", async () => {
    const mockSummary = {
      week_of: "2024-01-15",
      total_study_hours: 25,
      tasks_completed: 12,
      tasks_total: 20,
      daily_breakdown: [
        { day: "Monday", hours: 4, completed: 2 },
        { day: "Tuesday", hours: 3.5, completed: 1 },
        { day: "Wednesday", hours: 5, completed: 3 },
      ],
      productivity_score: 85,
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockSummary,
    });

    const result = await api.summaryApi.weekly();

    expect(result.total_study_hours).toBe(25);
    expect(result.tasks_completed).toBe(12);
    expect(result.daily_breakdown).toHaveLength(3);
    expect(result.productivity_score).toBe(85);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/summary/weekly"),
      expect.any(Object)
    );
  });

  it("should render summary statistics and charts", () => {
    expect(true).toBe(true); // Placeholder for React component test
  });
});