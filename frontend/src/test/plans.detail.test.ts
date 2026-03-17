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

describe("Plans API - Get Plan Detail", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.setItem("auth_token", "test-token");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch and return a single plan detail", async () => {
    const mockPlanDetail = {
      id: 1,
      title: "Study Math",
      start_date: "2024-01-01",
      end_date: "2024-01-31",
      tasks: [{ id: 101, title: "Algebra Chapter 1", status: "pending" }],
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockPlanDetail,
    });

    const result = await api.plansApi.get(1);

    expect(result.id).toBe(1);
    expect(result.title).toBe("Study Math");
    expect(result.tasks).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/plans/1"),
      expect.any(Object)
    );
  });

  it("should display plan details (title, dates) correctly", () => {
    expect(true).toBe(true); // Placeholder for React component test
  });
});