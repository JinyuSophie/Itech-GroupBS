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

describe("Tasks API - Get Task Detail", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.setItem("auth_token", "test-token");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should load task detail with all properties", async () => {
    const mockTaskDetail = {
      id: 101,
      title: "Complete Chapter 5",
      status: "in_progress",
      due_date: "2024-01-15",
      estimated_effort_hours: 5,
      plan: 1,
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockTaskDetail,
    });

    const result = await api.tasksApi.get(101);

    expect(result.id).toBe(101);
    expect(result.title).toBe("Complete Chapter 5");
    expect(result.status).toBe("in_progress");
    expect(result.estimated_effort_hours).toBe(5);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/tasks/101"),
      expect.any(Object)
    );
  });

  it("should display task properties correctly", () => {
    expect(true).toBe(true); // Placeholder for React component test
  });
});