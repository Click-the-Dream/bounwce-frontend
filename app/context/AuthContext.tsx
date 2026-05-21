"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { setupInterceptors } from "../services/axios-client";
import { websocket } from "../services/websocket";

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const [logoutSignal, setLogoutSignal] = useState(false);

  const [authDetails, setAuthDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true); // 🔹 new

  useEffect(() => {
    const storedUser = localStorage.getItem("authUser");

    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setAuthDetails(JSON.parse(storedUser));

      if (parsed?.access_token) {
        websocket.connect(parsed.access_token);
      }
    }

    setupInterceptors(
      () => {
        const stored = localStorage.getItem("authUser");
        return stored ? JSON.parse(stored) : null;
      },
      (newUser) => updateAuth(newUser),
    );

    // small delay ensures hydration stability
    setTimeout(() => {
      setIsLoading(false);
    }, 50);
  }, []);

  const updateAuth = (newUser: any) => {
    if (newUser) {
      setAuthDetails((prev: any) => {
        const resolved =
          typeof newUser === "function" ? newUser(prev) : newUser;
        localStorage.setItem("authUser", JSON.stringify(resolved));
        if (
          resolved?.access_token &&
          resolved.access_token !== prev?.access_token
        ) {
          websocket.reconnectWithToken(resolved.access_token);
        }
        return resolved;
      });
    } else {
      localStorage.removeItem("authUser");
      localStorage.removeItem("ws_token");
      websocket.disconnect();
      setAuthDetails(null);
      queryClient.removeQueries({ queryKey: ["authUser"] });
    }
  };

  const getCurrentUser = () => authDetails;

  return (
    <AuthContext.Provider
      value={{
        authDetails,
        updateAuth,
        logoutSignal,
        setLogoutSignal,
        getCurrentUser,
        isLoading, // 🔹 expose loading
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
