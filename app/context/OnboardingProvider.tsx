"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import api from "../services/api";

interface OnboardingContextType {
  user: any | null;
  isTourActive: boolean;
  mustUpdateProfile: boolean;
  startTour: () => void;
  resetTour: () => void;
  completeTour: () => Promise<void>;
  refreshUser: () => Promise<void>;
  registerMobileSidebarControls: (controls: {
    open: () => void;
    close: () => void;
  }) => () => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const TOUR_VERSION = "v3";

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const { authDetails, updateUser } = useAuth();
  const user = authDetails?.user ?? null;

  const [isTourActive, setIsTourActive] = useState(false);
  const [tourBooted, setTourBooted] = useState(false);
  const sidebarControlsRef = React.useRef<{
    open: () => void;
    close: () => void;
  } | null>(null);

  const mustUpdateProfile = Boolean(user && !user.profile_pic);

  const onboardingStorageKey = user?.id
    ? `bouwnce:onboarding:${user.id}:${TOUR_VERSION}`
    : null;

  const registerMobileSidebarControls = useCallback(
    (controls: { open: () => void; close: () => void }) => {
      sidebarControlsRef.current = controls;
      return () => {
        if (sidebarControlsRef.current === controls) {
          sidebarControlsRef.current = null;
        }
      };
    },
    [],
  );

  const openMobileSidebar = useCallback(() => {
    sidebarControlsRef.current?.open();
  }, []);

  const closeMobileSidebar = useCallback(() => {
    sidebarControlsRef.current?.close();
  }, []);

  const startTour = useCallback(() => {
    if (!user || mustUpdateProfile) return;
    setIsTourActive(false);
    window.setTimeout(() => setIsTourActive(true), 0);
  }, [mustUpdateProfile, user]);

  const resetTour = useCallback(() => {
    if (!user || mustUpdateProfile || !onboardingStorageKey) return;
    localStorage.removeItem(onboardingStorageKey);
    updateUser({ ...user, hasCompletedOnboarding: false });
    setTourBooted(true);
    setIsTourActive(false);
    window.setTimeout(() => setIsTourActive(true), 0);
  }, [mustUpdateProfile, onboardingStorageKey, updateUser, user]);

  const completeTour = useCallback(async () => {
    setIsTourActive(false);

    if (onboardingStorageKey) {
      localStorage.setItem(onboardingStorageKey, "completed");
    }

    if (user) {
      updateUser({ ...user, hasCompletedOnboarding: true });
    }

    // The current app does not expose an onboarding endpoint.
    // Keep the tour completion local until the backend exposes one.
    // The authenticated user's `hasCompletedOnboarding` field is still updated
    // in memory so the current session does not restart the tour.
    return;
  }, [onboardingStorageKey, updateUser, user]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get("/users/me");
      const updated = res.data?.data ?? res.data;
      if (updated) updateUser(updated);
    } catch (err) {
      console.error("[ONBOARDING] Failed to refresh user", err);
    }
  }, [updateUser]);

  useEffect(() => {
    setTourBooted(false);
    setIsTourActive(false);

    if (!user || mustUpdateProfile) return;

    const forceTour = new URLSearchParams(window.location.search).get("tour") === "1";
    const serverCompleted = Boolean(user.hasCompletedOnboarding);
    const localCompleted = onboardingStorageKey
      ? localStorage.getItem(onboardingStorageKey) === "completed"
      : false;

    if (!forceTour && (serverCompleted || localCompleted)) {
      setTourBooted(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setTourBooted(true);
      setIsTourActive(true);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [user?.id, user?.hasCompletedOnboarding, mustUpdateProfile, onboardingStorageKey]);

  const value = useMemo(
    () => ({
      user,
      isTourActive: isTourActive && tourBooted && !mustUpdateProfile,
      mustUpdateProfile,
      startTour,
      resetTour,
      completeTour,
      refreshUser,
      registerMobileSidebarControls,
      openMobileSidebar,
      closeMobileSidebar,
    }),
    [
      closeMobileSidebar,
      completeTour,
      isTourActive,
      mustUpdateProfile,
      openMobileSidebar,
      refreshUser,
      registerMobileSidebarControls,
      resetTour,
      startTour,
      tourBooted,
      user,
    ],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error("useOnboarding must be used within OnboardingProvider");
  return context;
};
