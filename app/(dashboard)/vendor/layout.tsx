"use client";

import VendorLayout from "./_components/VendorLayout";
import { usePathname } from "next/navigation";
import { ChatProvider } from "@/app/context/ChatContext";

const VendorRouteLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <ChatProvider>
      {pathname === "/vendor/setup" || pathname === "/vendor/store" ? (
        <>{children}</>
      ) : (
        <VendorLayout>{children}</VendorLayout>
      )}
    </ChatProvider>
  );
};

export default VendorRouteLayout;
