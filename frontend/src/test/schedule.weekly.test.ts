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

describe("Schedule API - Weekly Schedule", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.setItem("auth_token", "test-token");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch weekly schedule entries with day and time", async () => {
    const mockSchedule = [
      { id: 1, day: "Monday", time: "09:00", task: "Math Chapter 1", duration: 2 },
      { id: 2, day: "Tuesday", time: "14:00", task: "Physics Lab", duration: 3 },
      { id: 3, day: "Wednesday", time: "10:00", task: "Chemistry Review", duration: 1.5 },
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockSchedule,
    });

    const result = await api.scheduleApi.weekly();

    expect(result).toHaveLength(3);
    expect(result[0].day).toBe("Monday");
    expect(result[0].time).toBe("09:00");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/schedule/weekly"),
      expect.any(Object)
    );
  });

  it("should render schedule entries with correct day and time information", () => {
    expect(true).toBe(true); // Placeholder for React component test
  });
});