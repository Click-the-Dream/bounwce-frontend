"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import InterestSelector from "./InterestSelector";
import { Portal } from "@/app/protocols/Portal";
import { useOnboarding } from "@/app/context/OnboardingProvider";
import { MandatoryProfileGuard } from "./onboarding/MandatoryProfileGuard";
import { OnboardingTour } from "./onboarding/OnboardingTour";
import { useEffect } from "react";

const BuyerLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { registerMobileSidebarControls } = useOnboarding();

  useEffect(() => {
    return registerMobileSidebarControls({
      open: () => setSidebarOpen(true),
      close: () => setSidebarOpen(false),
    });
  }, [registerMobileSidebarControls]);

  return (
    <>
      <div className="h-screen w-full bg-[#FBFBFC] flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Mobile Sidebar */}
        <Portal>
          <div
            className={`fixed inset-0 z-[90000] lg:hidden transition ${
              sidebarOpen ? "visible" : "invisible"
            }`}
          >
            {/* Overlay */}
            <div
              className={`absolute inset-0 z-0 bg-black/30 backdrop-blur-sm transition-opacity ${
                sidebarOpen ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => setSidebarOpen(false)}
            />

            {/* Drawer */}
            <div
              className={`absolute left-0 top-0 z-20 h-full w-64 bg-white shadow-lg transform transition-transform ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <Sidebar isMobile onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        </Portal>

        {/* Main Content */}
        <div className="w-full h-full flex-1 flex flex-col overflow-y-auto">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />

          <main className="w-full h-full">{children}</main>
        </div>
      </div>

      <InterestSelector />
      <MandatoryProfileGuard />
      <OnboardingTour />
    </>
  );
};

export default BuyerLayout;
