"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/app/context/AuthContext";

const LAST_APP_ROUTE_KEY = "bouwnce_last_app_route";

const isStandalonePWA = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    navigatorWithStandalone.standalone === true
  );
};

const isRestorableAppRoute = (pathname: string) => {
  /**
   * Only remember actual authenticated app pages.
   *
   * This prevents us from saving:
   * /
   * /login
   * /register
   * /marketplace
   * etc.
   */
  return pathname === "/app" || pathname.startsWith("/app/");
};

export default function PWARestore() {
  const pathname = usePathname();
  const router = useRouter();

  const { authDetails, isLoading: authLoading } = useAuth();

  const restoredRef = useRef(false);

  /**
   * Remember the last place the user was inside /app.
   *
   * This is localStorage intentionally because closing the
   * PWA should NOT erase the last location.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!pathname) {
      return;
    }

    if (!isRestorableAppRoute(pathname)) {
      return;
    }

    /**
     * Save pathname + query string + hash.
     *
     * Example:
     * /app/chat/123?tab=media
     */
    const currentRoute =
      pathname + window.location.search + window.location.hash;

    localStorage.setItem(LAST_APP_ROUTE_KEY, currentRoute);
  }, [pathname]);

  /**
   * Restore the last app page when the PWA starts.
   *
   * Important:
   * We only do this when running as the installed PWA.
   *
   * Normal browser visits to "/" continue showing the
   * normal website homepage.
   */
  useEffect(() => {
    if (restoredRef.current) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    /**
     * Only restore when the app is opened at the root.
     */
    if (pathname !== "/") {
      return;
    }

    /**
     * Wait until authentication has finished loading.
     */
    if (authLoading) {
      return;
    }

    /**
     * Not logged in.
     */
    if (!authDetails?.user?.id) {
      restoredRef.current = true;
      return;
    }

    const lastRoute = localStorage.getItem(LAST_APP_ROUTE_KEY);

    /**
     * No previous app location.
     */
    if (!lastRoute) {
      restoredRef.current = true;
      router.replace("/app");
      return;
    }

    /**
     * Safety check.
     */
    if (!lastRoute.startsWith("/app")) {
      restoredRef.current = true;
      router.replace("/app");
      return;
    }

    restoredRef.current = true;

    router.replace(lastRoute);
  }, [authDetails, authLoading, pathname, router]);

  return null;
}
