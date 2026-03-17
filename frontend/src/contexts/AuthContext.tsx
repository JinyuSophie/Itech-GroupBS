import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User } from "@/types/models";
import { authApi } from "@/services/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("study_planner_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authApi
      .session()
      .then((response) => {
        localStorage.setItem("study_planner_user", JSON.stringify(response.user));
        setUser(response.user);
      })
      .catch(() => {
        localStorage.removeItem("study_planner_user");
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    localStorage.setItem("study_planner_user", JSON.stringify(response.user));
    setUser(response.user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const response = await authApi.register({ email, password, confirm_password: password });
    localStorage.setItem("study_planner_user", JSON.stringify(response.user));
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => undefined);
    localStorage.removeItem("study_planner_user");
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
