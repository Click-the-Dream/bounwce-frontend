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
import ChatResetBridge from "./Chatresetbridge ";
import PushNotificationManager from "../_components/PushNotificationManager";
import InstallApp from "../_components/InstallApp";
import { OnboardingProvider } from "./OnboardingProvider";
import PWARestore from "../_components/PWARestore";

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
      <AuthProvider>
        <PWARestore />
        <ChatProvider>
          <NotificationProvider>
            <PushNotificationManager />
            <InstallApp />
            <ChatResetBridge />
            <StoreProvider>
              <OnboardingProvider>
                <SocketConnect>{children}</SocketConnect>
              </OnboardingProvider>

              <ToastContainer
                position="top-right"
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
                  "!bg-transparent !shadow-none !p-0 !min-h-0 !rounded-none overflow-visible pointer-events-auto"
                }
                style={{
                  top: "3rem",
                  right: "0",
                  pointerEvents: "none",
                }}
              />
            </StoreProvider>
          </NotificationProvider>
        </ChatProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default AppProvider;
