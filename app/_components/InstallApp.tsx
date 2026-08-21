"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

const DISMISS_KEY = "bouwnce_prompt_dismissed";

export default function InstallApp() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  /**
   * Check whether the website is currently running
   * as an installed PWA.
   */
  const checkStandalone = () => {
    if (typeof window === "undefined") {
      return false;
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsStandalone(standalone);

    return standalone;
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    /*
     * First check whether we are already inside
     * the installed PWA.
     */
    if (checkStandalone()) {
      return;
    }

    /**
     * Fired by supported browsers when the website
     * is eligible for installation.
     */
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      const promptEvent = event as BeforeInstallPromptEvent;

      setInstallPrompt(promptEvent);

      /*
       * Dismissal only lasts for the current browser session.
       * This prevents the old permanent localStorage problem.
       */
      const dismissed = sessionStorage.getItem(DISMISS_KEY);

      if (!dismissed) {
        setShowBanner(true);
      }
    };

    /**
     * Fired after the PWA has actually been installed.
     */
    const handleAppInstalled = () => {
      console.log("Bouwnce PWA installed");

      setInstallPrompt(null);
      setShowBanner(false);

      /*
       * Clear any old dismissal state.
       */
      sessionStorage.removeItem(DISMISS_KEY);

      checkStandalone();
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener("appinstalled", handleAppInstalled);

    /**
     * Re-check standalone mode after a short delay.
     *
     * Some browsers need a little time before their
     * display-mode state is available.
     */
    const timer = window.setTimeout(() => {
      checkStandalone();
    }, 1000);

    /**
     * Re-check when the user returns to the page.
     *
     * This is useful when the user installs/uninstalls
     * the PWA and then returns to the website.
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const standalone = checkStandalone();

      if (standalone) {
        setInstallPrompt(null);
        setShowBanner(false);
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    /**
     * Also listen for display-mode changes.
     */
    const mediaQuery = window.matchMedia(
      "(display-mode: standalone)"
    );

    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      const standalone =
        event.matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone ===
          true;

      setIsStandalone(standalone);

      if (standalone) {
        setInstallPrompt(null);
        setShowBanner(false);
      }
    };

    mediaQuery.addEventListener(
      "change",
      handleDisplayModeChange
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        handleAppInstalled
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      mediaQuery.removeEventListener(
        "change",
        handleDisplayModeChange
      );

      window.clearTimeout(timer);
    };
  }, []);

  /**
   * Open the browser's native PWA installation dialog.
   */
  const handleInstall = async () => {
    if (!installPrompt) {
      console.warn(
        "Install prompt is not currently available."
      );

      return;
    }

    try {
      await installPrompt.prompt();

      const choice = await installPrompt.userChoice;

      console.log(
        "PWA installation choice:",
        choice.outcome
      );

      if (choice.outcome === "accepted") {
        setShowBanner(false);

        sessionStorage.removeItem(DISMISS_KEY);
      } else {
        /*
         * The user rejected the native browser prompt.
         * Hide our banner for this browser session.
         */
        sessionStorage.setItem(DISMISS_KEY, "true");

        setShowBanner(false);
      }
    } catch (error) {
      console.error(
        "Failed to display PWA install prompt:",
        error
      );
    } finally {
      /*
       * beforeinstallprompt can only be used once.
       */
      setInstallPrompt(null);
    }
  };

  /**
   * Dismiss the custom install banner.
   *
   * This is intentionally sessionStorage instead of
   * localStorage so it does not permanently suppress
   * the install UI.
   */
  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");

    setShowBanner(false);
  };

  /*
   * Never display the install banner when the app
   * is already running as an installed PWA.
   */
  if (isStandalone) {
    return null;
  }

  /*
   * Do not display anything until the browser has
   * supplied a real install prompt.
   */
  if (!showBanner || !installPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 z-[1000] md:max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl bg-white p-4 shadow-2xl shadow-black/10 border border-lighter-ash">

        {/* Dismiss */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          className="absolute top-1 right-2 rounded-lg p-1 text-ash hover:bg-lighter-ash hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>

        {/* App information */}
        <div className="flex items-center gap-3 pr-6 sm:pr-0 flex-1 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lighter-ash/60">
            <Image
              src="/icon.png"
              alt="Bouwnce Logo"
              width={28}
              height={28}
              priority
              className="h-7 w-auto object-contain"
            />
          </div>

          <div className="flex-1 min-w-0 font-SFPro">
            <p className="text-sm font-semibold tracking-tight text-foreground truncate">
              Get Bouwnce App
            </p>

            <p className="text-xs text-ash truncate">
              Faster access & push notifications
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full">

            {/* Install */}
            <button
              type="button"
              onClick={handleInstall}
              className="w-full sm:w-auto rounded-xl bg-brand-orange px-5 py-2.5 sm:py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm text-center whitespace-nowrap"
            >
              Install
            </button>

            {/* Continue on Web */}
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full sm:w-auto rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 sm:py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors text-center whitespace-nowrap"
            >
              Continue on Web
            </button>

          </div>
        </div>
      </div>
    </div>
  );
        }
