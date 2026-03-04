/**
 * AuthContext.tsx — Global authentication state management.
 *
 * This context provides user session data and auth actions (login, register, logout)
 * to every component in the app via the useAuth() hook.
 *
 * CURRENT STATE: Uses mock authentication (no real API calls).
 * TO CONNECT TO DJANGO:
 *   1. Import authApi from "@/services/api".
 *   2. Replace the mock logic in login() and register() with real API calls.
 *   3. Store the returned token in localStorage for subsequent requests.
 *   4. Optionally call authApi.session() on mount to restore sessions.
 *
 * SESSION PERSISTENCE:
 *   The user object is stored in localStorage so the session survives page reloads.
 *   The auth token is also stored separately for use by the API service layer.
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { User } from "@/types/models";

// ─── Context Type Definition ───────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;               // Current logged-in user, or null if not authenticated
  isAuthenticated: boolean;        // Convenience boolean derived from user !== null
  login: (email: string, password: string) => Promise<void>;   // Authenticate existing user
  register: (email: string, password: string) => Promise<void>; // Create new user account
  logout: () => void;              // Clear session and redirect to login
}

// Create context with null default — useAuth() enforces it's used within provider
const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider Component ────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  /**
   * Initialize user state from localStorage.
   * This allows the session to persist across page refreshes.
   * The lazy initializer (function form) runs only once on mount.
   */
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("study_planner_user");
    return saved ? JSON.parse(saved) : null;
  });

  /**
   * login() — Authenticate an existing user.
   *
   * TODO: Replace mock logic with:
   *   const response = await authApi.login({ email, password });
   *   localStorage.setItem("auth_token", response.token);
   *   localStorage.setItem("study_planner_user", JSON.stringify(response.user));
   *   setUser(response.user);
   */
  const login = useCallback(async (email: string, _password: string) => {
    // Mock: create a fake user object without hitting the backend
    const mockUser: User = { user_id: 1, email, created_at: new Date().toISOString() };
    localStorage.setItem("study_planner_user", JSON.stringify(mockUser));
    localStorage.setItem("auth_token", "mock-token");
    setUser(mockUser);
  }, []);

  /**
   * register() — Create a new user account.
   *
   * TODO: Replace mock logic with:
   *   const response = await authApi.register({ email, password, confirm_password: password });
   *   localStorage.setItem("auth_token", response.token);
   *   localStorage.setItem("study_planner_user", JSON.stringify(response.user));
   *   setUser(response.user);
   */
  const register = useCallback(async (email: string, _password: string) => {
    const mockUser: User = { user_id: 1, email, created_at: new Date().toISOString() };
    localStorage.setItem("study_planner_user", JSON.stringify(mockUser));
    localStorage.setItem("auth_token", "mock-token");
    setUser(mockUser);
  }, []);

  /**
   * logout() — Clear all stored auth data and reset state.
   * This will cause ProtectedRoute to redirect the user to the login page.
   */
  const logout = useCallback(() => {
    localStorage.removeItem("study_planner_user");
    localStorage.removeItem("auth_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useAuth() — Access auth state and actions from any component.
 * Must be used inside an <AuthProvider>.
 *
 * Usage:
 *   const { user, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
