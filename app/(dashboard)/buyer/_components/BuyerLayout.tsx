"use client";
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { ChatProvider } from "@/app/context/ChatContext";
import { useAuth } from "@/app/context/AuthContext";
import InterestSelector from "./InterestSelector";

const BuyerLayout = ({ children }: { children: React.ReactNode }) => {
  const { authDetails } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ChatProvider>
      <div className="h-screen bg-[#FBFBFC] flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Mobile Sidebar (Drawer) */}
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
        <div className="flex-1 flex flex-col">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>

      <InterestSelector />
    </ChatProvider>
  );
};

export default BuyerLayout;
