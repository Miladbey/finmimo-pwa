import { fetch } from "expo/fetch";
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export function getApiUrl(): string {
  const host = process.env.EXPO_PUBLIC_DOMAIN;

  // اگر متغیر ست شده بود (برای حالت‌های خاص)، همون رو استفاده کن
  if (host) {
    return `https://${host}`;
  }

  // روی وب: به صورت خودکار از آدرس فعلی سایت استفاده کن
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location) {
      const { protocol, hostname, origin } = window.location;

      // حالت توسعه روی سیستم (اختیاری): API معمولاً روی 5000 هست
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return `${protocol}//${hostname}:5000`;
      }

      // حالت واقعی روی سرور
      return origin;
    }
  }

  throw new Error("Cannot determine API URL");
}

async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null;
    }
    return await SecureStore.getItemAsync("auth_token");
  } catch {
    return null;
  }
}

export async function setToken(token: string | null) {
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        if (token) localStorage.setItem("auth_token", token);
        else localStorage.removeItem("auth_token");
      }
    } else {
      if (token) await SecureStore.setItemAsync("auth_token", token);
      else await SecureStore.deleteItemAsync("auth_token");
    }
  } catch {}
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);
  const authHeaders = await getAuthHeaders();

  const res = await fetch(url.toString(), {
    method,
    headers: {
      ...authHeaders,
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);
    const authHeaders = await getAuthHeaders();

    const res = await fetch(url.toString(), {
      headers: authHeaders,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
