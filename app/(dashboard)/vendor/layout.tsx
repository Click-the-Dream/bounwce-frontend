"use client";

import VendorLayout from "./_components/VendorLayout";
import { usePathname } from "next/navigation";

const VendorRouteLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <>
      {pathname === "/vendor/setup" || pathname === "/vendor/store" ? (
        <>{children}</>
      ) : (
        <VendorLayout>{children}</VendorLayout>
      )}
    </>
  );
};

export default VendorRouteLayout;
