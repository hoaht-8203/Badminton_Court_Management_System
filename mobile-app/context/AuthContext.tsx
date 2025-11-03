import React from "react";
import { setOnForbidden, setOnUnauthorized, ApiError } from "../lib/axios";
import {
  authService,
  CurrentUserResponse,
  LoginRequest,
  RegisterRequest,
} from "../services/authService";
import { useRouter } from "expo-router";
import { Alert } from "react-native";

type AuthContextState = {
  user: CurrentUserResponse | null;
  loading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  signUp: (payload: RegisterRequest) => Promise<void>;
  hasRole: (role: string) => boolean;
  isAuthorized: (roles: string[] | undefined) => boolean;
};

const AuthContext = React.createContext<AuthContextState | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = React.useState<CurrentUserResponse | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  const handleUnauthorized = React.useCallback(() => {
    setUser(null);
    try {
      router.push("/login");
    } catch {}
  }, [router]);

  React.useEffect(() => {
    setOnUnauthorized(handleUnauthorized);
    setOnForbidden(handleUnauthorized);
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
      if (error.status === 401) handleUnauthorized();
    }
  }, [handleUnauthorized]);

  React.useEffect(() => {
    (async () => {
      await fetchCurrentUser();
      setLoading(false);
    })();
  }, [fetchCurrentUser]);

  const login = React.useCallback(
    async (payload: LoginRequest) => {
      try {
        const res = await authService.login(payload);
        if (res && res.data) {
          setUser(res.data);
          router.push("/");
        }
      } catch (err: unknown) {
        const error = err as ApiError;
        Alert.alert("Login failed", error.message || "Unknown error");
        throw err;
      }
    },
    [router]
  );

  const signUp = React.useCallback(
    async (payload: RegisterRequest) => {
      try {
        const res = await authService.signUp(payload);
        if (res) {
          // After sign up, require email verification
          setUser(null);
          Alert.alert(
            "Đăng ký thành công",
            "Vui lòng kiểm tra email để xác thực tài khoản"
          );
          router.push({
            pathname: "/verify-email",
            params: { email: payload.email },
          });
        }
      } catch (err: unknown) {
        const error = err as ApiError;
        Alert.alert("Register failed", error.message || "Unknown error");
        throw err;
      }
    },
    [router]
  );

  const refresh = React.useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  const logout = React.useCallback(async () => {
    try {
      await authService.logout();
    } catch {}
    setUser(null);
    router.push("/login");
  }, [router]);

  const hasRole = React.useCallback(
    (role: string) => {
      const roles = (user?.roles || []) as string[];
      return roles.includes(role);
    },
    [user]
  );

  const isAuthorized = React.useCallback(
    (roles?: string[]) => {
      if (!roles || roles.length === 0) return !!user;
      const userRoles = (user?.roles || []) as string[];
      return roles.some((role) => userRoles.includes(role));
    },
    [user]
  );

  const value = React.useMemo<AuthContextState>(
    () => ({
      user,
      loading,
      login,
      refresh,
      logout,
      signUp,
      hasRole,
      isAuthorized,
    }),
    [user, loading, login, refresh, logout, signUp, hasRole, isAuthorized]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
