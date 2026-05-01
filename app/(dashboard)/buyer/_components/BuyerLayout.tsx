"use client";
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { ChatProvider } from "@/app/context/ChatContext";
import InterestSelector from "./InterestSelector";

const BuyerLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ChatProvider>
      <div className="h-screen w-full bg-[#FBFBFC] flex overflow-hidden">
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
        <div className="w-full h-full flex-1 flex flex-col overflow-y-auto">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="w-full h-full">{children}</main>
        </div>
      </div>

      {/* <InterestSelector /> */}
    </ChatProvider>
  );
};

export default BuyerLayout;
