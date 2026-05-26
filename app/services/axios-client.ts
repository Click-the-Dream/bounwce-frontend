import axios, { InternalAxiosRequestConfig } from "axios";
import api from "./api";

// setupInterceptors now receives a refreshFn instead of updateAuth directly.
// The refresh logic and shared promise live in AuthContext — the interceptor
// just calls through, so there's only one refresh promise in the entire app.

export const setupInterceptors = (
  getAuth: () => any,
  refreshFn: () => Promise<string | null>,
) => {
  // ── REQUEST: attach token

  api.interceptors.request.use((config: InternalAxiosRequestConfig<any>) => {
    if (config.headers?.Authorization) return config;

    let auth = getAuth();
    if (!auth?.access_token) {
      const stored = localStorage.getItem("authUser");
      if (stored) auth = JSON.parse(stored);
    }

    if (auth?.access_token) {
      config.headers.Authorization = `Bearer ${auth.access_token}`;
    }

    return config;
  });

  // ── RESPONSE: handle 401 ────────────────────────────────────────────────
  // Delegates refresh to AuthContext's doRefresh (shared promise).
  // On success: retry with the new token.
  // On failure: AuthContext already called updateAuth(null) → logout.
  // No local refreshPromise needed — it's managed in AuthContext.

  api.interceptors.response.use(
    (res) => res,
    async (error: { config: any; response: { status: number } }) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        const newToken = await refreshFn();

        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }

        // refreshFn already handled logout — just reject
        return Promise.reject(error);
      }

      return Promise.reject(error);
    },
  );
};
