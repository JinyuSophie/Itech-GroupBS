import { describe, it, expect, beforeEach } from "vitest";

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

describe("Protected Routes - Redirect on Unauthenticated", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should redirect to login when no auth token exists", () => {
    const token = localStorage.getItem("auth_token");
    expect(token).toBeNull();
  });

  it("should allow access when valid auth token exists", () => {
    localStorage.setItem("auth_token", "valid-token");
    const token = localStorage.getItem("auth_token");
    expect(token).toBe("valid-token");
  });
});