"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { setupInterceptors } from "../services/axios-client";

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const [logoutSignal, setLogoutSignal] = useState(false);

  const [authDetails, setAuthDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true); // 🔹 new

  useEffect(() => {
    const storedUser = localStorage.getItem("authUser");

    if (storedUser) {
      setAuthDetails(JSON.parse(storedUser));
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
        return resolved;
      });
    } else {
      localStorage.removeItem("authUser");
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
