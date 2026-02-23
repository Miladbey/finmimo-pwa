import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { apiRequest, setToken, queryClient } from "@/lib/query-client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null;
    }
    return await SecureStore.getItemAsync("auth_token");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await loadToken();
      if (token) {
        try {
          const res = await apiRequest("GET", "/api/me");
          const data = await res.json();
          setUser(data.user);
        } catch {
          await setToken(null);
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await res.json();
    await setToken(data.token);
    setUser(data.user);
    queryClient.invalidateQueries();
  };

  const signup = async (email: string, password: string, displayName: string) => {
    const res = await apiRequest("POST", "/api/auth/signup", { email, password, displayName });
    const data = await res.json();
    await setToken(data.token);
    setUser(data.user);
    queryClient.invalidateQueries();
  };

  const logout = async () => {
    await setToken(null);
    setUser(null);
    queryClient.clear();
  };

  const value = useMemo(
    () => ({ user, isLoading, login, signup, logout }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
