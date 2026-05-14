"use client";

import React, { useState, useEffect } from "react";
import VendorLayout from "./_components/VendorLayout";
import { usePathname, useParams } from "next/navigation";
import { NotificationProvider } from "@/app/context/NotificationContext";

import { ChatProvider, useChatUtils } from "@/app/context/ChatContext";
import { useSocketConnection } from "@/app/hooks/use-socket";
import { useAuth } from "@/app/context/AuthContext";
import { websocket } from "@/app/services/websocket";
import { ConnectionStatusToast } from "@/app/_utils/ConnectionStatusToast";

const SocketInitializer = () => {
  const { authDetails } = useAuth();
  const params = useParams<{ chatId: string }>();
  const chatId = params.chatId;
  
  const { setTypingUsers, setOnlineUsers } = useChatUtils();

  const token = authDetails?.access_token;
  const userId = authDetails?.user?.id;
  const activeChatUserId = chatId;

  useSocketConnection({
    token,
    authUserId: userId,
    setTypingUsers,
    setOnlineUsers,
    activeConversationId: activeChatUserId,
  });

  return null;
};

const VendorRouteLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  
  const [wsState, setWsState] = useState<
    "connecting" | "connected" | "reconnecting" | "disconnected"
  >("disconnected");

  useEffect(() => {
    const handler = (state: any) => setWsState(state);
    websocket.onStateChange(handler);
    return () => websocket.offStateChange(handler);
  }, []);

  return (
    <NotificationProvider>
      <ChatProvider>
        <SocketInitializer />        
        
        {pathname === "/vendor/setup" || pathname === "/vendor/store" ? (
          <>{children}</>
        ) : (
          <VendorLayout>{children}</VendorLayout>
        )}

        <ConnectionStatusToast state={wsState} />
      </ChatProvider>
    </NotificationProvider>
  );
};

export default VendorRouteLayout;