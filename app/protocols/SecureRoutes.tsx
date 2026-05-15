"use client";

import { useAuth } from "../context/AuthContext";
import useStore from "../hooks/use-store";
import { usePathname } from "next/navigation";
import Fallback from "../_components/Fallback";
import Redirect from "./Redirect";

const SecureRoute = ({ children }: { children: React.ReactNode }) => {
  const { authDetails, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const { useGetStoreOnboardingStatus } = useStore();

  const user = authDetails?.user;
  const userId = user?.id;

  const isVendorRoute = pathname.startsWith("/vendor");
  const isAdminRoute = pathname.startsWith("/admin");

  const { data: onboardingStatus, isLoading: statusLoading } =
    useGetStoreOnboardingStatus(userId);

  // Wait for auth + vendor onboarding status
  if (authLoading || (user?.role === "vendor" && statusLoading)) {
    return <Fallback />;
  }

  // Not logged in
  if (!user) {
    return <Redirect to="/login" />;
  }

  // Inactive account
  if (!user.is_active) {
    return <Redirect to="/login" />;
  }

  // ADMIN ROUTE PROTECTION
  if (isAdminRoute && user.role !== "admin") {
    return <Redirect to="/buyer" replace />;
  }

  // VENDOR ROUTE PROTECTION
  if (isVendorRoute) {
    // Only vendors can access vendor routes
    if (user.role !== "vendor") {
      return <Redirect to="/buyer" replace />;
    }

    // Vendor onboarding enforcement
    if (onboardingStatus && !onboardingStatus.is_onboarded) {
      if (pathname !== "/vendor/setup") {
        return <Redirect to="/vendor/setup" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default SecureRoute;