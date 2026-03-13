/**
 * AuthContext.tsx — Global authentication state management.
 *
 * This context provides user session data and auth actions (login, register, logout)
 * to every component in the app via the useAuth() hook.
 *
 * CURRENT STATE: Uses Django session authentication via backend API calls.
 * TO CONNECT TO DJANGO:
 *   1. Import authApi from "@/services/api".
 *   2. Persist the returned user in localStorage.
 *   3. Call authApi.session() on mount to restore sessions.
 *
 * SESSION PERSISTENCE:
 *   The user object is stored in localStorage so the session survives page reloads.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User } from "@/types/models";
import { authApi } from "@/services/api";

// ─── Context Type Definition ───────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;               // Current logged-in user, or null if not authenticated
  isAuthenticated: boolean;        // Convenience boolean derived from user !== null
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;   // Authenticate existing user
  register: (email: string, password: string) => Promise<void>; // Create new user account
  logout: () => Promise<void>;              // Clear session and redirect to login
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
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = async () => {
    try {
      const response = await authApi.session();
      setUser(response.user);
      setIsAuthenticated(true);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void checkSession();
  }, []);

  /**
   * login() — Authenticate an existing user.
   */
  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setUser(response.user);
    setIsAuthenticated(true);
  }, []);

  /**
   * register() — Create a new user account.
   */
  const register = useCallback(async (email: string, password: string) => {
    const response = await authApi.register({ email, password, confirm_password: password });
    setUser(response.user);
    setIsAuthenticated(true);
  }, []);

  /**
   * logout() — Clear all stored auth data and reset state.
   * This will cause ProtectedRoute to redirect the user to the login page.
   */
  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout, }}>
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
