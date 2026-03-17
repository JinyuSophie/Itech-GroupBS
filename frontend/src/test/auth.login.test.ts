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

describe("Auth API - Login Success", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should login successfully and store auth token", async () => {
    const mockToken = "test-auth-token-12345";
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ token: mockToken, user: { id: 1, email: "user@example.com" } }),
    });

    const result = await api.authApi.login({ email: "user@example.com", password: "password123" });

    expect(result.token).toBe(mockToken);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/login"),
      expect.objectContaining({ method: "POST" })
    );
  });
});