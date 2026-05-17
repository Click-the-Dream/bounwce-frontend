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
            position="bottom-right"
            stacked
            autoClose={2000}
            hideProgressBar
            closeButton={false}
            pauseOnHover
            draggable
            newestOnTop
            limit={5}
            toastStyle={{
              marginTop: "8px",
            }}
            toastClassName={() =>
              "!bg-transparent !shadow-none !p-0 !min-h-0 !rounded-none overflow-visible"
            }
            style={{
              bottom: "1.5rem",
              right: "0.5rem",
              paddingTop: "1rem",
            }}
          />
        </StoreProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default AppProvider;
