import type { InternalAxiosRequestConfig } from "axios";
import api from "./api";

type AuthDetails = { access_token?: string | null } | null | undefined;
type RefreshFn = () => Promise<string | null>;
type RequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let getCurrentAuth: (() => AuthDetails) | null = null;
let refreshAccessToken: RefreshFn | null = null;
let interceptorsInstalled = false;
const refreshPromises = new Map<string, Promise<string>>();
let blockedToken: string | null = null;
let nextRefreshAt = 0;
let consecutiveRefreshFailures = 0;

const BASE_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 30_000;
const ACCESS_TOKEN_SKEW_MS = 30_000;

function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const exp = JSON.parse(atob(padded))?.exp;
    return typeof exp === "number" ? exp * 1_000 : null;
  } catch {
    return null;
  }
}

function tokenNeedsRefresh(token: string): boolean {
  const expiresAt = getTokenExpiry(token);
  return expiresAt === null || expiresAt <= Date.now() + ACCESS_TOKEN_SKEW_MS;
}

function isPublicAuthRequest(url?: string): boolean {
  // These endpoints are used before a user has an authenticated session.
  // They must not be blocked by an existing session's refresh circuit breaker.
  return !!url && /\/auth\/(register|resend-otp|verify-code)(?:[/?#]|$)/i.test(url);
}

function refreshBlockedError(): Error {
  const error = new Error(
    "Your session is waiting for token refresh. This request was not sent; try again when the connection is available.",
  );
  error.name = "AuthRefreshBlockedError";
  return error;
}

/**
 * Opens a circuit for the current access token after a transient refresh failure.
 * Protected requests stay blocked until a refresh succeeds or the user signs in again.
 */
export function markRefreshBlocked(token: string | null | undefined): void {
  if (!token) return;

  if (blockedToken !== token) {
    consecutiveRefreshFailures = 0;
  }

  blockedToken = token;
  const delay = Math.min(
    BASE_RETRY_DELAY_MS * 2 ** consecutiveRefreshFailures,
    MAX_RETRY_DELAY_MS,
  );
  consecutiveRefreshFailures += 1;
  nextRefreshAt = Date.now() + delay;
}

/** Clears the circuit after a successful refresh or a new login/logout. */
export function markRefreshSucceeded(_token?: string | null): void {
  blockedToken = null;
  nextRefreshAt = 0;
  consecutiveRefreshFailures = 0;
}

export function resetAuthRefreshGate(): void {
  markRefreshSucceeded();
}

/** Returns whether a background/visibility-triggered refresh is outside backoff. */
export function canAttemptRefresh(token: string | null | undefined): boolean {
  if (!token || blockedToken !== token) return true;
  return Date.now() >= nextRefreshAt;
}

function getAuthToken(): string | null {
  return getCurrentAuth?.()?.access_token || null;
}

async function performRefresh(force = false): Promise<string> {
  const tokenBeforeRefresh = getAuthToken();
  if (!tokenBeforeRefresh || !refreshAccessToken) {
    throw refreshBlockedError();
  }

  // A logout/login can happen while an old refresh is in flight. Single-flight
  // is keyed by the token being refreshed so the new session never awaits or
  // reuses the previous session's refresh result.
  const existingRefresh = refreshPromises.get(tokenBeforeRefresh);
  if (existingRefresh) return existingRefresh;

  // A newly logged-in user has a different token and should not inherit the
  // previous user's transient-failure circuit breaker.
  if (blockedToken && blockedToken !== tokenBeforeRefresh) {
    markRefreshSucceeded();
  }

  if (
    !force &&
    blockedToken === tokenBeforeRefresh &&
    Date.now() < nextRefreshAt
  ) {
    throw refreshBlockedError();
  }

  const attempt = (async () => {
    try {
      const freshToken = await refreshAccessToken?.();
      if (freshToken) {
        // Do not let a late result from the previous session authorize a
        // request after the user has logged out or signed into another account.
        const latestToken = getAuthToken();
        if (!latestToken) {
          // Do not replay a request if the user logged out during refresh.
          throw refreshBlockedError();
        }
        if (latestToken !== tokenBeforeRefresh && latestToken !== freshToken) {
          // A different session replaced the session that initiated this refresh.
          throw refreshBlockedError();
        }
        markRefreshSucceeded(freshToken);
        return freshToken;
      }

      const latestToken = getAuthToken();
      if (latestToken && latestToken === tokenBeforeRefresh) {
        // The auth provider marks transient failures itself as well, since a
        // proactive refresh can happen outside this interceptor.
        if (blockedToken !== latestToken) markRefreshBlocked(latestToken);
      } else if (!latestToken) {
        markRefreshSucceeded();
      }
      throw refreshBlockedError();
    } catch (error) {
      const latestToken = getAuthToken();
      if (latestToken && latestToken === tokenBeforeRefresh) {
        if (blockedToken !== latestToken) markRefreshBlocked(latestToken);
      } else if (!latestToken) {
        // The provider cleared the session for an expired/invalid refresh token.
        markRefreshSucceeded();
      }
      throw error;
    }
  })();

  refreshPromises.set(tokenBeforeRefresh, attempt);
  try {
    return await attempt;
  } finally {
    if (refreshPromises.get(tokenBeforeRefresh) === attempt) {
      refreshPromises.delete(tokenBeforeRefresh);
    }
  }
}

function setAuthorization(config: RequestConfig, token: string): RequestConfig {
  config.headers = config.headers || ({} as RequestConfig["headers"]);
  config.headers.Authorization = `Bearer ${token}`;
  return config;
}

export const setupInterceptors = (
  getAuth: () => AuthDetails,
  refreshFn: RefreshFn,
) => {
  // Always update callbacks to the latest provider functions, but only install
  // Axios interceptors once. Reinstalling them on renders multiplies requests.
  getCurrentAuth = getAuth;
  refreshAccessToken = refreshFn;

  if (interceptorsInstalled) return;
  interceptorsInstalled = true;

  api.interceptors.request.use(
    async (rawConfig) => {
      const config = rawConfig as RequestConfig;
      if (isPublicAuthRequest(config.url)) return config;

      const accessToken = getAuthToken();
      // Preserve existing public/unauthenticated API behavior when there is no
      // authenticated session at all.
      if (!accessToken) return config;

      if (blockedToken && blockedToken !== accessToken) {
        markRefreshSucceeded(accessToken);
      }

      if (
        refreshPromises.has(accessToken) ||
        blockedToken === accessToken ||
        tokenNeedsRefresh(accessToken)
      ) {
        const freshToken = await performRefresh(false);
        return setAuthorization(config, freshToken);
      }

      return setAuthorization(config, accessToken);
    },
    (error) => Promise.reject(error),
  );

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config as RequestConfig | undefined;
      if (
        !original ||
        error.response?.status !== 401 ||
        original._retry ||
        isPublicAuthRequest(original.url) ||
        !getAuthToken()
      ) {
        return Promise.reject(error);
      }

      original._retry = true;
      try {
        // Concurrent 401s share one refresh attempt. If refresh is unavailable,
        // reject this request rather than replaying it with the stale token.
        const freshToken = await performRefresh(false);
        setAuthorization(original, freshToken);
        return api(original);
      } catch (refreshError) {
        return Promise.reject(refreshError || error);
      }
    },
  );

  if (typeof window !== "undefined") {
    // Browsers fire this when connectivity returns. Bypass backoff once so the
    // session can recover without requiring a page reload or a new API call.
    window.addEventListener("online", () => {
      const token = getAuthToken();
      if (token && blockedToken === token) {
        void performRefresh(true).catch(() => {
          // Keep the session blocked. Another online event or a later request
          // can retry, with normal backoff protecting the refresh endpoint.
        });
      }
    });
  }
};
