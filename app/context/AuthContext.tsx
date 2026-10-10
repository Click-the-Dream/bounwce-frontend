"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { websocket } from "../services/websocket";
import {
  canAttemptRefresh,
  markRefreshBlocked,
  markRefreshSucceeded,
  resetAuthRefreshGate,
  setupInterceptors,
} from "../services/axios-client";
import { refreshTokenCall } from "../services/auth";

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();

  const [authDetails, setAuthDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const authDetailsRef = useRef<any>(null);
  useEffect(() => {
    authDetailsRef.current = authDetails;
  }, [authDetails]);

  const chatResetRef = useRef<(() => void) | null>(null);
  const registerChatReset = useCallback((fn: () => void) => {
    chatResetRef.current = fn;
  }, []);

  // GLOBAL GUARDS
  const refreshInFlightRef = useRef<Promise<string | null> | null>(null);
  const logoutLockRef = useRef(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getTokenExp = (token: string) => {
    try {
      const payload = token.split(".")[1];
      if (!payload) return null;
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
      const exp = JSON.parse(atob(padded))?.exp;
      return typeof exp === "number" ? exp * 1000 : null;
    } catch {
      return null;
    }
  };

  const isExpired = (token: string) => {
    const exp = getTokenExp(token);
    return !exp || Date.now() > exp - 30_000;
  };

  const safeLogout = useCallback(async () => {
    if (logoutLockRef.current) return;
    logoutLockRef.current = true;

    // Update the ref synchronously so the Axios interceptor cannot observe the
    // old authenticated session during React's next render.
    authDetailsRef.current = null;
    resetAuthRefreshGate();

    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    chatResetRef.current?.();
    queryClient.clear();
    setAuthDetails(null);
    localStorage.removeItem("bouwnceUser");
    localStorage.removeItem("ws_token");
    websocket.disconnect();
  }, [queryClient]);

  const updateAccessToken = useCallback((token: string) => {
    const current = authDetailsRef.current;
    if (!current) return;

    const updated = { ...current, access_token: token };
    authDetailsRef.current = updated;
    markRefreshSucceeded(token);
    setAuthDetails(updated);
    localStorage.setItem("bouwnceUser", JSON.stringify(updated));
    websocket.reconnectWithToken(token);
  }, []);

  const refreshTokenSafe = useCallback(async (): Promise<string | null> => {
    if (refreshInFlightRef.current) return refreshInFlightRef.current;

    const request = (async () => {
      try {
        const token = await refreshTokenCall();
        if (!token || typeof token !== "string") {
          // A successful HTTP response without an access token is not a
          // recoverable session; it usually means the refresh cookie is invalid.
          throw new Error("AUTH_EXPIRED");
        }
        return token;
      } catch (err: any) {
        if (err?.message === "AUTH_EXPIRED") throw err;

        const status = err?.response?.status;
        const isAuthError = status === 400 || status === 401 || status === 403;
        if (isAuthError) {
          throw new Error("AUTH_EXPIRED");
        }

        // Network failures and server-side failures are transient. Keep the
        // session data, but do not let protected API requests use its old token.
        throw new Error("AUTH_REFRESH_UNAVAILABLE");
      }
    })();

    refreshInFlightRef.current = request;
    try {
      return await request;
    } finally {
      if (refreshInFlightRef.current === request) {
        refreshInFlightRef.current = null;
      }
    }
  }, []);

  // TOKEN REFRESH HANDLER
  const handleRefresh = useCallback(async (): Promise<string | null> => {
    const currentToken = authDetailsRef.current?.access_token as
      | string
      | undefined;

    if (!currentToken) return null;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      console.warn("[AUTH] offline; protected API requests will remain blocked");
      markRefreshBlocked(currentToken);
      return null;
    }

    // Keep refresh results attached to the session that initiated them. A late
    // response must not overwrite a newly signed-in user's token.
    const tokenAtStart = currentToken;

    try {
      const token = await refreshTokenSafe();
      if (!token) {
        markRefreshBlocked(authDetailsRef.current?.access_token);
        return null;
      }

      // Another caller may have completed the same shared refresh first.
      // Accept that same fresh token, but never overwrite a different session.
      const latestToken = authDetailsRef.current?.access_token;
      if (latestToken !== tokenAtStart) {
        return latestToken === token ? token : null;
      }

      updateAccessToken(token);
      return token;
    } catch (e: any) {
      if (e?.message === "AUTH_EXPIRED") {
        console.warn("[AUTH] refresh token expired or invalid; logging out");
        await safeLogout();
        return null;
      }

      markRefreshBlocked(authDetailsRef.current?.access_token);
      console.warn(
        "[AUTH] token refresh unavailable; protected API requests are blocked until refresh succeeds",
      );
      return null;
    }
  }, [refreshTokenSafe, updateAccessToken, safeLogout]);

  // PROACTIVE REFRESH SCHEDULER
  const scheduleRefresh = useCallback(
    (token: string) => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

      const exp = getTokenExp(token);
      if (!exp) return;

      const delay = exp - Date.now() - 60_000; // refresh 60s before expiry

      if (delay <= 0) {
        // Token is already expired or expiring very soon
        // Only refresh if it's actually expired, not just "about to expire"
        if (Date.now() > exp) {
          if (canAttemptRefresh(token)) void handleRefresh();
        } else {
          // Expires within 60s — schedule for actual expiry minus a buffer
          const urgentDelay = Math.max(exp - Date.now() - 5_000, 0);
          refreshTimerRef.current = setTimeout(() => {
            if (canAttemptRefresh(token)) void handleRefresh();
          }, urgentDelay);
        }
      } else {
        refreshTimerRef.current = setTimeout(() => {
          if (canAttemptRefresh(token)) void handleRefresh();
        }, delay);
      }
    },
    [handleRefresh],
  );

  useEffect(() => {
    const token = authDetails?.access_token;
    if (!token) return;
    scheduleRefresh(token);
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [authDetails?.access_token, scheduleRefresh]);

  // VISIBILITY FIX
  useEffect(() => {
    const onVisible = async () => {
      if (document.visibilityState !== "visible") return;
      const token = authDetails?.access_token;
      if (!token) return;
      if (isExpired(token)) {
        if (canAttemptRefresh(token)) await handleRefresh();
      } else {
        scheduleRefresh(token);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [authDetails?.access_token, handleRefresh, scheduleRefresh]);

  // INIT
  useEffect(() => {
    const stored = localStorage.getItem("bouwnceUser");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        authDetailsRef.current = parsed;
        setAuthDetails(parsed);
        if (parsed?.access_token) {
          websocket.connect(parsed.access_token);
        }
      } catch {
        localStorage.removeItem("bouwnceUser");
      }
    }

    // FIX (Bug 1): use the ref getter — always returns current token
    setupInterceptors(() => authDetailsRef.current, handleRefresh);

    websocket.onAuthFailure = async () => {
      const currentToken = authDetailsRef.current?.access_token as
        | string
        | undefined;
      if (!currentToken || !canAttemptRefresh(currentToken)) {
        console.warn("[WS] refresh skipped; session is already blocked by refresh backoff");
        return;
      }

      console.warn("[WS] auth failure → attempting silent refresh");
      const token = await handleRefresh();

      if (!token) {
        console.warn("[WS] refresh unavailable; session remains blocked until recovery");
      }
    };

    setTimeout(() => setIsLoading(false), 50);
    return () => {
      websocket.onAuthFailure = null;
    };
  }, []);

  // PUBLIC UPDATERS
  const updateAuth = useCallback(
    (user: any) => {
      if (!user) {
        safeLogout();
        return;
      }
      logoutLockRef.current = false;
      authDetailsRef.current = user;
      resetAuthRefreshGate();
      setAuthDetails(user);
      localStorage.setItem("bouwnceUser", JSON.stringify(user));
      if (user?.access_token) {
        websocket.reconnectWithToken(user.access_token);
      }
    },
    [safeLogout],
  );

  const updateUser = useCallback((patch: any) => {
    setAuthDetails((prev: any) => {
      if (!prev) return prev;
      const updated = { ...prev, user: { ...prev.user, ...patch } };
      localStorage.setItem("bouwnceUser", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authDetails,
        updateAuth,
        updateUser,
        isLoading,
        showAuthModal,
        setShowAuthModal,
        registerChatReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
