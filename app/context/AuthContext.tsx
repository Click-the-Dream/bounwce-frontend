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
import { setupInterceptors } from "../services/axios-client";
import { refreshTokenCall } from "../services/auth";

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();

  const [authDetails, setAuthDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ---------------- GLOBAL GUARDS ----------------
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);
  const logoutLockRef = useRef(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateAuthRef = useRef<any>(() => {});

  // ---------------- TOKEN HELPERS ----------------

  const getTokenExp = (token: string) => {
    try {
      return JSON.parse(atob(token.split(".")[1]))?.exp * 1000;
    } catch {
      return null;
    }
  };

  const isExpired = (token: string) => {
    const exp = getTokenExp(token);
    return !exp || Date.now() > exp - 30_000;
  };

  // ---------------- SAFE LOGOUT (CRITICAL FIX) ----------------

  const safeLogout = useCallback(() => {
    if (logoutLockRef.current) return;
    logoutLockRef.current = true;

    setAuthDetails(null);
    localStorage.removeItem("authUser");
    localStorage.removeItem("ws_token");

    websocket.disconnect();
    queryClient.clear();

    setTimeout(() => {
      logoutLockRef.current = false;
    }, 3000);
  }, [queryClient]);

  // ---------------- SINGLE REFRESH PIPELINE ----------------

  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = refreshTokenCall()
        .then((res) => res?.data?.access_token ?? null)
        .catch(() => null)
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }

    return refreshPromiseRef.current;
  }, []);

  const updateAccessToken = useCallback((token: string) => {
    setAuthDetails((prev: any) => {
      if (!prev) return prev;

      const updated = { ...prev, access_token: token };
      localStorage.setItem("authUser", JSON.stringify(updated));

      websocket.reconnectWithToken(token);
      return updated;
    });
  }, []);

  // ---------------- TOKEN REFRESH HANDLER ----------------

  const handleRefresh = useCallback(async () => {
    // 1. Don't refresh if we know we are offline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return null;
    }

    try {
      const newToken = await refreshToken();
      if (!newToken) {
        safeLogout(); // Only logout if token call explicitly returns null (invalid)
        return null;
      }
      updateAccessToken(newToken);
      return newToken;
    } catch (error: any) {
      if (!error.response || error.code === "ERR_NETWORK") {
        console.warn("Network disconnected; preserving local session.");
        return null;
      }
      safeLogout(); // Logout only on 401/403
      return null;
    }
  }, [refreshToken, safeLogout, updateAccessToken]);
  // expose to interceptor safely
  useEffect(() => {
    updateAuthRef.current = safeLogout;
  }, [safeLogout]);

  // ---------------- PROACTIVE SCHEDULER ----------------

  const scheduleRefresh = useCallback(
    (token: string) => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

      const exp = getTokenExp(token);
      if (!exp) return;

      const delay = exp - Date.now() - 60_000;

      const run = async () => {
        await handleRefresh();
      };

      if (delay <= 0) run();
      else refreshTimerRef.current = setTimeout(run, delay);
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

  // ---------------- VISIBILITY FIX ----------------

  useEffect(() => {
    const onVisible = async () => {
      if (document.visibilityState !== "visible") return;

      const token = authDetails?.access_token;
      if (!token) return;

      if (isExpired(token)) {
        await handleRefresh();
      } else {
        scheduleRefresh(token);
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [authDetails?.access_token, handleRefresh, scheduleRefresh]);

  // ---------------- INIT ----------------

  useEffect(() => {
    const stored = localStorage.getItem("authUser");

    if (stored) {
      const parsed = JSON.parse(stored);
      setAuthDetails(parsed);

      if (parsed?.access_token) {
        websocket.connect(parsed.access_token);
      }
    }

    setupInterceptors(() => authDetails, handleRefresh);

    websocket.onAuthFailure = handleRefresh;

    setTimeout(() => setIsLoading(false), 50);
  }, []);

  const updateAuth = (user: any) => {
    if (!user) return safeLogout();

    setAuthDetails(user);
    localStorage.setItem("authUser", JSON.stringify(user));

    if (user?.access_token) {
      websocket.reconnectWithToken(user.access_token);
    }
  };

  const updateUser = (patch: any) => {
    setAuthDetails((prev: any) => {
      if (!prev) return prev;

      const updated = {
        ...prev,
        user: { ...prev.user, ...patch },
      };

      localStorage.setItem("authUser", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        authDetails,
        updateAuth,
        updateUser,
        isLoading,
        showAuthModal,
        setShowAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
