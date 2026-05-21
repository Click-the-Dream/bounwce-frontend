"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useChatUtils } from "@/app/context/ChatContext";
import InterestSelector from "./InterestSelector";
import { useSocketConnection } from "@/app/hooks/use-socket";
import { useAuth } from "@/app/context/AuthContext";
import { useParams } from "next/navigation";
import { websocket } from "@/app/services/websocket";
import { ConnectionStatusToast } from "@/app/_utils/ConnectionStatusToast";

const BuyerLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wsState, setWsState] = useState<
    "connecting" | "connected" | "reconnecting" | "disconnected"
  >("disconnected");
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

  useEffect(() => {
    const cb = (state: any) => setWsState(state);

    websocket.onStateChange(cb);

    return () => websocket.offStateChange(cb);
  }, []);

  return (
    <>
      <div className="h-screen w-full bg-[#FBFBFC] flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Mobile Sidebar */}
        <div
          className={`fixed inset-0 z-40 lg:hidden transition ${
            sidebarOpen ? "visible" : "invisible"
          }`}
        >
          {/* Overlay */}
          <div
            className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity ${
              sidebarOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer */}
          <div
            className={`absolute left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar isMobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full h-full flex-1 flex flex-col overflow-y-auto">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />

          <main className="w-full h-full">{children}</main>
        </div>
      </div>

      <InterestSelector />
      <ConnectionStatusToast state={wsState} />
    </>
  );
};

export default BuyerLayout;
