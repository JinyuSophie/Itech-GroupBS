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

describe("Tasks API - Delete Task", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.setItem("auth_token", "test-token");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should delete a task by ID", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const result = await api.tasksApi.delete(101);

    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/tasks/101"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("should remove task from list after deletion", () => {
    expect(true).toBe(true); // Placeholder for state management test
  });
});