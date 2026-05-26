"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { setupInterceptors } from "../services/axios-client";
import { websocket } from "../services/websocket";
import { refreshTokenCall } from "../services/auth";

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const [logoutSignal, setLogoutSignal] = useState(false);
  const [authDetails, setAuthDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateAuthRef = useRef<(newUser: any) => void>(() => {});

  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── HELPERS

  const getTokenExp = (token: string): number | null => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload?.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  };

  const isTokenExpired = (token: string): boolean => {
    const exp = getTokenExp(token);
    if (!exp) return true;
    // Treat as expired if under 30s left — gives enough runway on mobile
    return Date.now() >= exp - 30_000;
  };

  const extractToken = (res: any): string | null =>
    res?.data?.access_token ?? null;

  const doRefresh = async (): Promise<string | null> => {
    try {
      const res = await refreshTokenCall(); // already deduplicated
      return res?.data?.access_token ?? null;
    } catch {
      return null;
    }
  };

  const updateAccessToken = (token: string) => {
    setAuthDetails((prev: any) => {
      if (!prev) return prev;
      const updated = { ...prev, access_token: token };
      localStorage.setItem("authUser", JSON.stringify(updated));
      websocket.reconnectWithToken(token);
      return updated;
    });
  };

  const updateAuth = (newUser: any) => {
    if (!newUser) {
      localStorage.removeItem("authUser");
      localStorage.removeItem("ws_token");
      websocket.disconnect();
      setAuthDetails(null);
      queryClient.removeQueries({ queryKey: ["authUser"] });
      return;
    }

    setAuthDetails(() => {
      localStorage.setItem("authUser", JSON.stringify(newUser));
      if (newUser?.access_token) {
        websocket.reconnectWithToken(newUser.access_token);
      }
      return newUser;
    });
  };

  const updateUser = (userPatch: any) => {
    setAuthDetails((prev: any) => {
      if (!prev) return prev;
      const updated = { ...prev, user: { ...prev.user, ...userPatch } };
      localStorage.setItem("authUser", JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    updateAuthRef.current = updateAuth;
  });

  // ── PROACTIVE REFRESH SCHEDULER ───────────────────────────────────────────
  // Schedules a refresh 60s before expiry. Re-runs whenever access_token
  // changes (i.e. after every successful refresh, rescheduling the next one).

  const scheduleRefresh = (token: string) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const exp = getTokenExp(token);
    if (!exp) return;

    const delay = exp - Date.now() - 60_000;

    const run = async () => {
      const newToken = await doRefresh();
      if (newToken) updateAccessToken(newToken);
      else updateAuthRef.current(null);
    };

    if (delay <= 0) {
      // Already in the danger zone — refresh immediately
      run();
    } else {
      refreshTimerRef.current = setTimeout(run, delay);
    }
  };

  useEffect(() => {
    const token = authDetails?.access_token;
    if (!token) return;
    scheduleRefresh(token);
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [authDetails?.access_token]);

  // ── VISIBILITY CHANGE HANDLER ─────────────────────────────────────────────
  // Fires when the user comes back to the tab/app on mobile after the browser
  // froze JS (and the proactive setTimeout never ran). Checks if the token
  // expired while frozen and refreshes before any API calls go out.

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible") return;

      const stored = localStorage.getItem("authUser");
      if (!stored) return;

      const { access_token } = JSON.parse(stored);
      if (!access_token) return;

      if (isTokenExpired(access_token)) {
        const newToken = await doRefresh();
        if (newToken) updateAccessToken(newToken);
        else updateAuthRef.current(null);
      } else {
        // Token still valid but reschedule the timer — it was cleared by the freeze
        scheduleRefresh(access_token);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // ── INIT ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const storedUser = localStorage.getItem("authUser");

    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setAuthDetails(parsed);
      if (parsed?.access_token) {
        websocket.connect(parsed.access_token);
      }
    }

    setupInterceptors(
      () => {
        const stored = localStorage.getItem("authUser");
        return stored ? JSON.parse(stored) : null;
      },
      // Pass doRefresh so the interceptor uses the same shared promise,
      // not its own independent fetch that races with everything else
      async () => {
        const newToken = await doRefresh();
        if (newToken) updateAccessToken(newToken);
        else updateAuthRef.current(null);
        return newToken;
      },
    );

    // WebSocket auth failure also routes through the shared refresh
    websocket.onAuthFailure = async () => {
      const newToken = await doRefresh();
      if (newToken) updateAccessToken(newToken);
      else updateAuthRef.current(null);
    };

    setTimeout(() => setIsLoading(false), 50);
  }, []);

  const getCurrentUser = () => authDetails;

  return (
    <AuthContext.Provider
      value={{
        authDetails,
        updateAuth,
        logoutSignal,
        setLogoutSignal,
        getCurrentUser,
        isLoading,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
