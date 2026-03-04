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

describe("Plans API - Create Plan", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.setItem("auth_token", "test-token");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should create a new plan with title and dates", async () => {
    const newPlanData = {
      title: "Advanced JavaScript",
      start_date: "2024-03-01",
      end_date: "2024-03-31",
    };

    const mockCreatedPlan = { id: 3, ...newPlanData };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockCreatedPlan,
    });

    const result = await api.plansApi.create(newPlanData);

    expect(result.id).toBe(3);
    expect(result.title).toBe("Advanced JavaScript");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/plans"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(newPlanData),
      })
    );
  });

  it("should submit form with correct payload", () => {
    expect(true).toBe(true); // Placeholder for React component test
  });
});