import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

export type UserRole = "amministratore" | "collaboratore";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  nome: string;
  email: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const checkAuth = async () => {
    try {
      const response = await apiRequest("GET", "/api/auth/status");
      const result = await response.json();
      setIsAuthenticated(result.authenticated || false);
      if (result.authenticated && result.user) {
        setUser(result.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData?: User) => {
    setIsAuthenticated(true);
    if (userData) {
      setUser(userData);
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const isAdmin = () => user?.role === "amministratore";
  const isCollaboratore = () => user?.role === "collaboratore";

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    checkAuth,
    isAdmin,
    isCollaboratore
  };
}