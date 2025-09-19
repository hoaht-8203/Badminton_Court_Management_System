"use client";

import { ApiError, setOnUnauthorized } from "@/lib/axios";
import { authService } from "@/services/authService";
import { CurrentUserResponse, LoginRequest } from "@/types-openapi/api";
import { message } from "antd";
import { useRouter } from "next/navigation";
import React from "react";

type AuthContextState = {
  user: CurrentUserResponse | null;
  loading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  isAuthorized: (roles: string[] | undefined) => boolean;
};

const AuthContext = React.createContext<AuthContextState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = React.useState<CurrentUserResponse | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  const handleUnauthorized = React.useCallback(() => {
    setUser(null);
    if (typeof window !== "undefined" && !window.location.href.includes("/quanlysancaulong/login")) {
      router.push("/quanlysancaulong/login");
    }
  }, [router]);

  React.useEffect(() => {
    setOnUnauthorized(() => handleUnauthorized());
    return () => setOnUnauthorized(undefined);
  }, [handleUnauthorized]);

  const fetchCurrentUser = React.useCallback(async () => {
    try {
      const res = await authService.getCurrentUser();
      if (res && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch (err: unknown) {
      const error = err as ApiError;
      message.error(error.message);
      if (error.status === 401) handleUnauthorized();
    }
  }, [handleUnauthorized]);

  React.useEffect(() => {
    // Hydrate current user on first load
    (async () => {
      await fetchCurrentUser();
      setLoading(false);
    })();
  }, [fetchCurrentUser]);

  const login = React.useCallback(async (payload: LoginRequest) => {
    const res = await authService.login(payload);
    if (res && res.data) {
      setUser(res.data);
    }
  }, []);

  const refresh = React.useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  const logout = React.useCallback(async () => {
    try {
      await authService.logout();
    } catch {}
    setUser(null);
    router.push("/quanlysancaulong/login");
  }, [router]);

  const hasRole = React.useCallback(
    (role: string) => {
      const roles = (user?.roles || []) as string[];
      return roles.includes(role);
    },
    [user],
  );

  const isAuthorized = React.useCallback(
    (roles?: string[]) => {
      if (!roles || roles.length === 0) return !!user; // only requires authentication
      const userRoles = (user?.roles || []) as string[];
      return roles.some((role) => userRoles.includes(role));
    },
    [user],
  );

  const value = React.useMemo<AuthContextState>(
    () => ({ user, loading, login, refresh, logout, hasRole, isAuthorized }),
    [user, loading, login, refresh, logout, hasRole, isAuthorized],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
