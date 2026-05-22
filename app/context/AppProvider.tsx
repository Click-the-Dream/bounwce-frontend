"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { AuthProvider } from "./AuthContext";
import { queryClient } from "../services/query-client";
import { StoreProvider } from "./StoreContext";
import { ToastContainer } from "react-toastify";
import SocketConnect from "./SocketConnect";
import { NotificationProvider } from "./NotificationContext";
import audioController from "../_utils/audioController";
import { ChatProvider } from "./ChatContext";

const AppProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const unlock = () => {
      audioController.unlock();

      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };

    window.addEventListener("touchstart", unlock, { once: true });
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <AuthProvider>
          <ChatProvider>
            <StoreProvider>
              <SocketConnect>{children}</SocketConnect>

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
          </ChatProvider>
        </AuthProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
};

export default AppProvider;
