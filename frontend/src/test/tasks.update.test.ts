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

describe("Tasks API - Update Task", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.setItem("auth_token", "test-token");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should update task fields (title, status, due_date)", async () => {
    const updateData = {
      title: "Updated Chapter 5",
      status: "completed",
      due_date: "2024-01-20",
    };

    const mockUpdatedTask = { id: 101, ...updateData, estimated_effort_hours: 5, plan: 1 };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockUpdatedTask,
    });

    const result = await api.tasksApi.update(101, updateData);

    expect(result.title).toBe("Updated Chapter 5");
    expect(result.status).toBe("completed");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/tasks/101"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(updateData),
      })
    );
  });
});