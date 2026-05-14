import axios, { InternalAxiosRequestConfig } from "axios";
import api from "./api";

let isRefreshing = false;
let failedQueue: {
  resolve: (token: any) => void;
  reject: (reason?: any) => void;
}[] = [];

let refreshPromise: Promise<any> | null = null;

const processQueue = (error: null, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Helper to check expiry locally before sending request
const isTokenExpired = (token: string) => {
  if (!token) return true;
  try {
    const { exp } = JSON.parse(atob(token.split(".")[1]));
    // Returns true if expired or expiring in the next 5 seconds
    return Date.now() >= exp * 1000 - 5000;
  } catch {
    return true;
  }
};

export const setupInterceptors = (
  getAuth: () => any,
  updateAuth: (arg0: null) => void,
) => {
  api.interceptors.request.use((config: InternalAxiosRequestConfig<any>) => {
    if (config.headers?.Authorization) {
      return config;
    }

    let auth = getAuth();

    if (!auth?.access_token) {
      const stored = sessionStorage.getItem("authUser");
      if (stored) auth = JSON.parse(stored);
    }

    if (auth?.access_token) {
      config.headers.Authorization = `Bearer ${auth.access_token}`;
    }

    return config;
  });

  // RESPONSE: The "Emergency" Refresh
  api.interceptors.response.use(
    (res: any) => res,
    async (error: { config: any; response: { status: number } }) => {
      const originalRequest = error.config;

      // Only attempt refresh on 401 and if it's not a retry
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (!refreshPromise) {
          refreshPromise = axios
            .post(
              `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh-token`,
              {},
              { withCredentials: true },
            )
            .then(({ data }) => {
              const newToken = data?.data?.access_token;

              const stored = sessionStorage.getItem("authUser");

              if (stored && newToken) {
                const parsed = JSON.parse(stored);
                const updatedUser = { ...parsed, access_token: newToken };

                sessionStorage.setItem("authUser", JSON.stringify(updatedUser));
                return newToken;
              }

              throw new Error("No refresh token");
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        try {
          const newToken = await refreshPromise;

          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          return api(originalRequest);
        } catch (err) {
          updateAuth(null);
          return Promise.reject(err);
        }
      }
      return Promise.reject(error);
    },
  );
};
