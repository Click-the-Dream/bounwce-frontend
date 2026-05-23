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

  // ---------------- HELPERS ----------------

  const getTokenExp = (token: string): number | null => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload?.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  };

  const extractToken = (res: any) => {
    return res?.data?.access_token;
  };

  // ---------------- TOKEN UPDATE ONLY ----------------

  const updateAccessToken = (token: string) => {
    setAuthDetails((prev: any) => {
      if (!prev) return prev;

      const updated = {
        ...prev,
        access_token: token,
      };

      localStorage.setItem("authUser", JSON.stringify(updated));

      websocket.reconnectWithToken(token);

      return updated;
    });
  };

  // ---------------- FULL AUTH UPDATE ----------------

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

  useEffect(() => {
    updateAuthRef.current = updateAuth;
  });

  // ---------------- INIT ----------------

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
      (newUser) => updateAuthRef.current(newUser),
    );

    // ---------------- REFRESH ON AUTH FAILURE ----------------

    websocket.onAuthFailure = async () => {
      try {
        const res = await refreshTokenCall();
        const token = extractToken(res);

        if (!token) return updateAuthRef.current(null);

        updateAccessToken(token);
      } catch {
        updateAuthRef.current(null);
      }
    };

    setTimeout(() => setIsLoading(false), 50);
  }, []);

  // ---------------- PROACTIVE REFRESH ----------------

  useEffect(() => {
    const token = authDetails?.access_token;
    if (!token) return;

    const exp = getTokenExp(token);
    if (!exp) return;

    const delay = exp - Date.now() - 60_000;

    if (delay <= 0) {
      refreshTokenCall()
        .then((res) => {
          const token = extractToken(res);
          if (token) updateAccessToken(token);
        })
        .catch(() => updateAuthRef.current(null));

      return;
    }

    const timer = setTimeout(() => {
      refreshTokenCall()
        .then((res) => {
          const token = extractToken(res);
          if (token) updateAccessToken(token);
        })
        .catch(() => updateAuthRef.current(null));
    }, delay);

    return () => clearTimeout(timer);
  }, [authDetails?.access_token]);

  // ---------------- CONTEXT ----------------

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
