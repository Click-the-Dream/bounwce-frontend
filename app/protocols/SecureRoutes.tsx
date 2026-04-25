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

  // 🔹 Wait for auth + onboarding
  if (authLoading || (user?.role === "vendor" && statusLoading)) {
    return <Fallback />;
  }

  // 🔹 Not logged in
  if (!user) {
    return <Redirect to="/login" />;
  }

  // 🔹 Inactive account
  if (!user.is_active) {
    return <Redirect to="/login" />;
  }

  // 🔹 ROLE-BASED ACCESS CONTROL
  switch (user.role) {
    case "admin":
      // Only allow admin routes
      if (!isAdminRoute) {
        return <Redirect to="/admin/newsletter" replace />;
      }
      return <>{children}</>;

    case "vendor":
      // Block vendor from admin
      if (isAdminRoute) {
        return <Redirect to="/vendor" replace />;
      }

      // Enforce onboarding
      if (onboardingStatus && !onboardingStatus.is_onboarded) {
        if (pathname === "/vendor/setup") {
          return <>{children}</>;
        }
        return <Redirect to="/vendor/setup" replace />;
      }

      return <>{children}</>;

    case "user":
      // Block user from admin/vendor
      if (isAdminRoute || isVendorRoute) {
        return <Redirect to="/" replace />;
      }
      return <>{children}</>;

    default:
      return <Redirect to="/login" />;
  }
};

export default SecureRoute;
