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

  // FIX (Bug 1): keep a ref that is always current so the axios interceptor
  // closure never reads stale state. Updated on every authDetails change.
  const authDetailsRef = useRef<any>(null);
  useEffect(() => {
    authDetailsRef.current = authDetails;
  }, [authDetails]);

  // FIX (Bug 3 + safeLogout): a ref to the chat reset function injected from
  // ChatContext via registerChatReset(). This lets AuthContext call
  // resetChatState() without a circular import.
  const chatResetRef = useRef<(() => void) | null>(null);
  const registerChatReset = useCallback((fn: () => void) => {
    chatResetRef.current = fn;
  }, []);

  // ---------------- GLOBAL GUARDS ----------------
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);
  const logoutLockRef = useRef(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ---------------- SAFE LOGOUT ----------------
  // FIX (Bug 3): safeLogout now also wipes IndexedDB + prewarm ref.
  // It imports lazily to avoid circular deps between AuthContext ↔ chat-store.
  const safeLogout = useCallback(async () => {
    if (logoutLockRef.current) return;
    logoutLockRef.current = true;

    // 1. Wipe in-memory chat state (prewarmRef, selectedChat, etc.)
    chatResetRef.current?.();

    // 2. Wipe IndexedDB for the current user — never block logout on failure
    try {
      const userId = authDetailsRef.current?.user?.id;
      if (userId) {
        const { deleteChatDB } = await import("../store/chat-store");
        await deleteChatDB(userId);
      }
    } catch {}

    // 3. Clear React Query cache
    queryClient.clear();

    // 4. Clear auth state + storage
    setAuthDetails(null);
    localStorage.removeItem("authUser");
    localStorage.removeItem("ws_token");

    // 5. Disconnect websocket
    websocket.disconnect();

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
  const handleRefresh = useCallback(async (): Promise<string | null> => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return null;
    }

    try {
      const newToken = await refreshToken();
      if (!newToken) {
        await safeLogout();
        return null;
      }
      updateAccessToken(newToken);
      return newToken;
    } catch (error: any) {
      if (!error.response || error.code === "ERR_NETWORK") {
        console.warn("Network disconnected; preserving local session.");
        return null;
      }
      await safeLogout();
      return null;
    }
  }, [refreshToken, safeLogout, updateAccessToken]);

  // ---------------- PROACTIVE REFRESH SCHEDULER ----------------
  const scheduleRefresh = useCallback(
    (token: string) => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      const exp = getTokenExp(token);
      if (!exp) return;
      const delay = exp - Date.now() - 60_000;
      if (delay <= 0) handleRefresh();
      else refreshTimerRef.current = setTimeout(() => handleRefresh(), delay);
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
      if (isExpired(token)) await handleRefresh();
      else scheduleRefresh(token);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [authDetails?.access_token, handleRefresh, scheduleRefresh]);

  // ---------------- INIT ----------------
  // FIX (Bug 1): pass () => authDetailsRef.current so the interceptor always
  // reads the latest token, not the null value captured at mount time.
  useEffect(() => {
    const stored = localStorage.getItem("authUser");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAuthDetails(parsed);
        if (parsed?.access_token) {
          websocket.connect(parsed.access_token);
        }
      } catch {
        localStorage.removeItem("authUser");
      }
    }

    // FIX (Bug 1): use the ref getter — always returns current token
    setupInterceptors(() => authDetailsRef.current, handleRefresh);

    // FIX (Bug 4): store the cleanup so it can be replaced if needed.
    // Assign once; handleRefresh is stable due to useCallback.
    websocket.onAuthFailure = handleRefresh;

    setTimeout(() => setIsLoading(false), 50);

    return () => {
      // FIX (Bug 4): clean up the websocket handler on unmount
      websocket.onAuthFailure = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once

  // ---------------- PUBLIC UPDATERS ----------------
  const updateAuth = useCallback(
    (user: any) => {
      if (!user) {
        safeLogout();
        return;
      }
      setAuthDetails(user);
      localStorage.setItem("authUser", JSON.stringify(user));
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
      localStorage.setItem("authUser", JSON.stringify(updated));
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
        registerChatReset, // FIX: exposed so ChatProvider can register its reset fn
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
