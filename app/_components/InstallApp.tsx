"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

interface NavigatorWithPWA extends Navigator {
  standalone?: boolean;

  getInstalledRelatedApps?: () => Promise<
    Array<{
      id?: string;
      platform?: string;
      url?: string;
    }>
  >;
}

type InstallState =
  | "idle"
  | "available"
  | "installing"
  | "installed";

const INSTALLED_KEY = "bouwnce_app_installed";
const DISMISS_KEY = "bouwnce_prompt_dismissed";

export default function InstallApp() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [installState, setInstallState] =
    useState<InstallState>("idle");

  const [isStandalone, setIsStandalone] =
    useState(false);

  /**
   * Check whether the current page is running
   * inside the installed PWA.
   */
  const checkStandalone = useCallback(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const nav = navigator as NavigatorWithPWA;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches ||
      nav.standalone === true;

    setIsStandalone(standalone);

    return standalone;
  }, []);

  /**
   * Check whether the app was previously installed.
   *
   * This is intentionally persistent because a new
   * browser tab does NOT receive the old `appinstalled`
   * event.
   */
  const hasInstalledMarker = useCallback(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return (
      localStorage.getItem(INSTALLED_KEY) === "true"
    );
  }, []);

  /**
   * Try to verify whether an installed related app
   * still exists.
   *
   * This is only available in some browsers.
   */
  const checkInstalledRelatedApp =
    useCallback(async () => {
      if (typeof window === "undefined") {
        return false;
      }

      const nav = navigator as NavigatorWithPWA;

      if (!nav.getInstalledRelatedApps) {
        return null;
      }

      try {
        const apps =
          await nav.getInstalledRelatedApps();

        return apps.length > 0;
      } catch (error) {
        console.debug(
          "getInstalledRelatedApps unavailable:",
          error
        );

        return null;
      }
    }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let mounted = true;

    /**
     * --------------------------------------------------
     * INITIALIZATION
     * --------------------------------------------------
     */
    const initialize = async () => {
      /**
       * If currently running inside the installed app,
       * never show the popup.
       */
      if (checkStandalone()) {
        if (mounted) {
          setInstallState("idle");
          setInstallPrompt(null);
        }

        return;
      }

      /**
       * First check our persistent installation marker.
       */
      const markedInstalled =
        hasInstalledMarker();

      if (markedInstalled) {
        /**
         * Try to verify the installation if the browser
         * supports getInstalledRelatedApps().
         */
        const relatedApp =
          await checkInstalledRelatedApp();

        if (!mounted) {
          return;
        }

        if (relatedApp === true) {
          /**
           * Definitely installed.
           */
          setInstallState("installed");
          setInstallPrompt(null);

          return;
        }

        if (relatedApp === false) {
          /**
           * Browser explicitly says the related app
           * isn't installed anymore.
           *
           * Clear stale state.
           */
          localStorage.removeItem(
            INSTALLED_KEY
          );

          /**
           * Don't show Open App.
           *
           * Wait for beforeinstallprompt.
           */
          return;
        }

        /**
         * relatedApp === null means the browser doesn't
         * support the API.
         *
         * In that case, use our persistent marker.
         */
        setInstallState("installed");
        setInstallPrompt(null);

        return;
      }

      /**
       * No installation marker.
       *
       * Wait for beforeinstallprompt.
       */
    };

    initialize();

    /**
     * --------------------------------------------------
     * BROWSER INSTALL PROMPT AVAILABLE
     * --------------------------------------------------
     */
    const handleBeforeInstallPrompt = (
      event: Event
    ) => {
      event.preventDefault();

      if (!mounted) {
        return;
      }

      const promptEvent =
        event as BeforeInstallPromptEvent;

      console.log(
        "Bouwnce can be installed"
      );

      /**
       * If we already know that the app is installed,
       * don't replace the Open App UI with Install.
       */
      if (hasInstalledMarker()) {
        return;
      }

      setInstallPrompt(promptEvent);
      setInstallState("available");
      setIsStandalone(false);
    };

    /**
     * --------------------------------------------------
     * APP INSTALLED
     * --------------------------------------------------
     */
    const handleAppInstalled = () => {
      if (!mounted) {
        return;
      }

      console.log(
        "Bouwnce installation completed"
      );

      /**
       * NOW we permanently remember that this browser
       * installed Bouwnce.
       *
       * This is what allows a completely new tab
       * hours later to show Open App.
       */
      localStorage.setItem(
        INSTALLED_KEY,
        "true"
      );

      /**
       * Installation is complete.
       */
      setInstallPrompt(null);
      setInstallState("installed");

      /**
       * Clear dismissal.
       */
      sessionStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      "appinstalled",
      handleAppInstalled
    );

    /**
     * --------------------------------------------------
     * VISIBILITY
     * --------------------------------------------------
     */
    const handleVisibilityChange = () => {
      if (
        document.visibilityState !== "visible"
      ) {
        return;
      }

      window.setTimeout(async () => {
        if (!mounted) {
          return;
        }

        /**
         * If we're now inside the PWA, hide.
         */
        if (checkStandalone()) {
          setInstallState("idle");
          setInstallPrompt(null);

          return;
        }

        /**
         * Check whether the app is still installed.
         */
        const markedInstalled =
          hasInstalledMarker();

        if (!markedInstalled) {
          return;
        }

        const relatedApp =
          await checkInstalledRelatedApp();

        if (!mounted) {
          return;
        }

        if (relatedApp === false) {
          /**
           * App was likely uninstalled.
           */
          localStorage.removeItem(
            INSTALLED_KEY
          );

          setInstallState("idle");

          return;
        }

        /**
         * Either verified or browser doesn't support
         * the verification API.
         */
        setInstallState("installed");
        setInstallPrompt(null);
      }, 300);
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    /**
     * --------------------------------------------------
     * DISPLAY MODE
     * --------------------------------------------------
     */
    const mediaQuery = window.matchMedia(
      "(display-mode: standalone)"
    );

    const handleDisplayModeChange = (
      event: MediaQueryListEvent
    ) => {
      if (!mounted) {
        return;
      }

      if (event.matches) {
        setIsStandalone(true);
        setInstallState("idle");
        setInstallPrompt(null);
      } else {
        setIsStandalone(false);
      }
    };

    mediaQuery.addEventListener(
      "change",
      handleDisplayModeChange
    );

    /**
     * --------------------------------------------------
     * CLEANUP
     * --------------------------------------------------
     */
    return () => {
      mounted = false;

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
    };
  }, [
    checkStandalone,
    hasInstalledMarker,
    checkInstalledRelatedApp,
  ]);

  /**
   * --------------------------------------------------
   * INSTALL
   * --------------------------------------------------
   */
  const handleInstall = async () => {
    if (!installPrompt) {
      return;
    }

    /**
     * Immediately change to Installing.
     */
    setInstallState("installing");

    try {
      /**
       * Show browser's native install dialog.
       */
      await installPrompt.prompt();

      /**
       * Wait for user's choice.
       */
      const choice =
        await installPrompt.userChoice;

      console.log(
        "Browser installation choice:",
        choice.outcome
      );

      if (choice.outcome === "dismissed") {
        /**
         * They cancelled the browser prompt.
         *
         * They are NOT installed.
         */
        setInstallState("idle");
        setInstallPrompt(null);

        return;
      }

      /**
       * IMPORTANT:
       *
       * The user accepted.
       *
       * Do NOT set installed here.
       *
       * appinstalled is responsible for that.
       */
      console.log(
        "Installation accepted. Waiting for appinstalled..."
      );

      /**
       * Keep "Installing..." until appinstalled.
       */

    } catch (error) {
      console.error(
        "Bouwnce installation failed:",
        error
      );

      setInstallState("available");
    } finally {
      /**
       * beforeinstallprompt is one-shot.
       */
      setInstallPrompt(null);
    }
  };

  /**
   * --------------------------------------------------
   * OPEN APP
   * --------------------------------------------------
   */
  const handleOpenApp = () => {
    window.location.href =
      "web+bouwnce://open";
  };

  /**
   * --------------------------------------------------
   * CONTINUE WEB
   * --------------------------------------------------
   */
  const handleContinueWeb = () => {
    sessionStorage.setItem(
      DISMISS_KEY,
      "true"
    );

    setInstallState("idle");
  };

  /**
   * --------------------------------------------------
   * CLOSE
   * --------------------------------------------------
   */
  const handleClose = () => {
    sessionStorage.setItem(
      DISMISS_KEY,
      "true"
    );

    setInstallState("idle");
  };

  /**
   * Never display inside the installed app.
   */
  if (isStandalone) {
    return null;
  }

  if (installState === "idle") {
    return null;
  }

  /**
   * ==================================================
   * INSTALLING
   * ==================================================
   */
  if (installState === "installing") {
    return (
      <div className="fixed bottom-4 left-3 right-3 sm:left-4 sm:right-4 md:left-auto md:right-6 z-[1000] md:max-w-lg">
        <div className="relative rounded-2xl bg-white p-4 shadow-2xl shadow-black/10 border border-lighter-ash">

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="absolute top-1.5 right-2 rounded-lg p-1 text-ash hover:bg-lighter-ash hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3 pr-7">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-lighter-ash/60">
              <Image
                src="/icon.png"
                alt="Bouwnce Logo"
                width={28}
                height={28}
                priority
                className="h-7 w-auto object-contain"
              />
            </div>

            <div className="min-w-0 flex-1 font-SFPro">
              <p className="text-sm font-semibold text-foreground">
                Installing Bouwnce...
              </p>

              <p className="mt-0.5 text-xs leading-4 text-ash">
                Please wait while the app is being installed.
              </p>
            </div>

            <div className="shrink-0">
              <span className="flex h-9 items-center gap-2 rounded-xl bg-gray-100 px-3 text-xs font-semibold text-gray-600">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-brand-orange animate-spin" />
                <span className="hidden sm:inline">
                  Installing...
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * ==================================================
   * INSTALLED
   * ==================================================
   */
  if (installState === "installed") {
    return (
      <div className="fixed bottom-4 left-3 right-3 sm:left-4 sm:right-4 md:left-auto md:right-6 z-[1000] md:max-w-lg">
        <div className="relative rounded-2xl bg-white p-4 shadow-2xl shadow-black/10 border border-lighter-ash">

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="absolute top-1.5 right-2 rounded-lg p-1 text-ash hover:bg-lighter-ash hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

            {/* App information */}
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-6 sm:pr-0">
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-lighter-ash/60">
                <Image
                  src="/icon.png"
                  alt="Bouwnce Logo"
                  width={28}
                  height={28}
                  priority
                  className="h-7 w-auto object-contain"
                />
              </div>

              <div className="min-w-0 font-SFPro">
                <p className="text-sm font-semibold text-foreground">
                  Bouwnce App Available
                </p>

                <p className="mt-0.5 text-xs leading-4 text-ash">
                  Open the Bouwnce app or continue using the web version.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2 shrink-0">

              <button
                type="button"
                onClick={handleOpenApp}
                className="w-full sm:w-auto rounded-xl bg-brand-orange px-4 py-2.5 sm:py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm whitespace-nowrap"
              >
                Open App
              </button>

              <button
                type="button"
                onClick={handleContinueWeb}
                className="w-full sm:w-auto rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 sm:py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                Continue on Web
              </button>

            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * ==================================================
   * INSTALL AVAILABLE
   * ==================================================
   */
  if (
    installState === "available" &&
    installPrompt
  ) {
    return (
      <div className="fixed bottom-4 left-3 right-3 sm:left-4 sm:right-4 md:left-auto md:right-6 z-[1000] md:max-w-lg">
        <div className="relative rounded-2xl bg-white p-4 shadow-2xl shadow-black/10 border border-lighter-ash">

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close install prompt"
            className="absolute top-1.5 right-2 rounded-lg p-1 text-ash hover:bg-lighter-ash hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3 pr-7">

            {/* Logo */}
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-lighter-ash/60">
              <Image
                src="/icon.png"
                alt="Bouwnce Logo"
                width={28}
                height={28}
                priority
                className="h-7 w-auto object-contain"
              />
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1 font-SFPro">
              <p className="text-sm font-semibold text-foreground">
                Get Bouwnce App
              </p>

              <p className="mt-0.5 text-xs leading-4 text-ash">
                Faster access and push notifications.
              </p>
            </div>

            {/* ONLY Install */}
            <button
              type="button"
              onClick={handleInstall}
              className="shrink-0 rounded-xl bg-brand-orange px-5 py-2.5 sm:py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm whitespace-nowrap"
            >
              Install
            </button>

          </div>
        </div>
      </div>
    );
  }

  return null;
      }
