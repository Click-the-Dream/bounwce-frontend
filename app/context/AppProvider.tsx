"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { AuthProvider } from "./AuthContext";
import { queryClient } from "../services/query-client";
import { StoreProvider } from "./StoreContext";
import { Slide, ToastContainer } from "react-toastify";

const AppProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StoreProvider>
          {children}

          <ToastContainer
            autoClose={2000}
            draggable
            position="bottom-right"
            transition={Slide}
            theme="light"
          />
        </StoreProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default AppProvider;
