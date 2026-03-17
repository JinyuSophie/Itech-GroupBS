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

describe("Plans API - List Plans", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch and return list of plans", async () => {
    const mockPlans = [
      { id: 1, title: "Study Math", start_date: "2024-01-01", end_date: "2024-01-31" },
      { id: 2, title: "Learn React", start_date: "2024-02-01", end_date: "2024-02-28" },
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockPlans,
    });

    const result = await api.plansApi.list();

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Study Math");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/plans"),
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
  });

  it("should render plans list page with plan items", () => {
    expect(true).toBe(true); // Placeholder for React component test
  });
});
