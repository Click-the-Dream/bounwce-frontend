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

const DISMISS_KEY = "bouwnce_prompt_dismissed";

export default function InstallApp() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [installState, setInstallState] =
    useState<InstallState>("idle");

  const [isStandalone, setIsStandalone] =
    useState(false);

  /**
   * Check whether this page is currently running
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
   * Check whether the PWA is already installed
   * and related to this website.
   *
   * This is supported in Chromium-based browsers
   * where getInstalledRelatedApps is available.
   */
  const checkInstalledRelatedApp =
    useCallback(async () => {
      if (typeof window === "undefined") {
        return false;
      }

      const nav = navigator as NavigatorWithPWA;

      if (!nav.getInstalledRelatedApps) {
        return false;
      }

      try {
        const apps =
          await nav.getInstalledRelatedApps();

        const installed = apps.length > 0;

        if (installed) {
          console.log(
            "Bouwnce installed related app detected"
          );

          setInstallState("installed");
          setInstallPrompt(null);

          return true;
        }
      } catch (error) {
        console.debug(
          "Unable to check installed related apps:",
          error
        );
      }

      return false;
    }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let mounted = true;

    /**
     * --------------------------------------------------
     * INITIAL STATE
     * --------------------------------------------------
     */

    const initialize = async () => {
      /**
       * If already inside the PWA, hide everything.
       */
      if (checkStandalone()) {
        if (mounted) {
          setInstallState("idle");
          setInstallPrompt(null);
        }

        return;
      }

      /**
       * Check whether the app was installed previously.
       *
       * This allows a fresh browser tab after installation
       * to show "Open App".
       */
      const installed =
        await checkInstalledRelatedApp();

      if (installed) {
        return;
      }

      /**
       * Otherwise wait for beforeinstallprompt.
       */
    };

    initialize();

    /**
     * --------------------------------------------------
     * INSTALL PROMPT
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
        "Bouwnce installation is available"
      );

      setInstallPrompt(promptEvent);

      /**
       * The browser is telling us that the website
       * is currently installable.
       */
      setInstallState("available");

      setIsStandalone(false);
    };

    /**
     * --------------------------------------------------
     * APP INSTALLED
     * --------------------------------------------------
     *
     * IMPORTANT:
     *
     * This is the point where we know installation
     * actually completed.
     */

    const handleAppInstalled = () => {
      if (!mounted) {
        return;
      }

      console.log(
        "Bouwnce installation completed"
      );

      setInstallPrompt(null);

      /**
       * NOW it is safe to show Open App.
       */
      setInstallState("installed");

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

    const handleVisibilityChange = async () => {
      if (
        document.visibilityState !== "visible"
      ) {
        return;
      }

      /**
       * Give the browser a moment to update PWA state.
       */
      window.setTimeout(async () => {
        if (!mounted) {
          return;
        }

        /**
         * If we're now running standalone,
         * hide everything.
         */
        if (checkStandalone()) {
          setInstallState("idle");
          setInstallPrompt(null);

          return;
        }

        /**
         * Otherwise check for a previously installed
         * related app.
         */
        await checkInstalledRelatedApp();
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
        /**
         * User is now inside the PWA.
         */
        setIsStandalone(true);
        setInstallState("idle");
        setInstallPrompt(null);
      } else {
        /**
         * Back to browser.
         */
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
    checkInstalledRelatedApp,
  ]);

  /**
   * --------------------------------------------------
   * INSTALL
   * --------------------------------------------------
   */

  const handleInstall = async () => {
    if (!installPrompt) {
      console.warn(
        "Install prompt is no longer available."
      );

      return;
    }

    /**
     * Immediately show Installing.
     *
     * We do NOT say installed yet.
     */
    setInstallState("installing");

    try {
      /**
       * Open browser's native install dialog.
       */
      await installPrompt.prompt();

      /**
       * Wait for user's response.
       */
      const choice =
        await installPrompt.userChoice;

      console.log(
        "Native install dialog:",
        choice.outcome
      );

      if (choice.outcome === "dismissed") {
        /**
         * User cancelled the browser dialog.
         *
         * We don't have an installation.
         */
        setInstallState("available");

        /**
         * The original beforeinstallprompt is consumed,
         * so remove it.
         */
        setInstallPrompt(null);

        return;
      }

      /**
       * User clicked Install in the browser dialog.
       *
       * IMPORTANT:
       *
       * DO NOT change to "installed".
       *
       * Stay on Installing until appinstalled fires.
       */
      console.log(
        "Installation accepted. Waiting for appinstalled event..."
      );

      /**
       * Some browsers may not fire appinstalled reliably.
       *
       * We perform a delayed installed-app check.
       */
      window.setTimeout(async () => {
        const installed =
          await checkInstalledRelatedApp();

        if (installed) {
          setInstallState("installed");
        }
      }, 1500);
    } catch (error) {
      console.error(
        "Bouwnce installation failed:",
        error
      );

      /**
       * Installation failed.
       */
      setInstallState("available");
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
   * Never show inside the PWA.
   */
  if (isStandalone) {
    return null;
  }

  /**
   * Nothing to display.
   */
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
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 z-[1000] md:max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="relative flex items-center gap-4 rounded-2xl bg-white p-4 shadow-2xl shadow-black/10 border border-lighter-ash">

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="absolute top-1 right-2 rounded-lg p-1 text-ash hover:bg-lighter-ash hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-0 pr-6">
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

            <div className="min-w-0 font-SFPro">
              <p className="text-sm font-semibold tracking-tight text-foreground truncate">
                Installing Bouwnce...
              </p>

              <p className="text-xs text-ash truncate">
                Please wait while the app is being installed
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-brand-orange animate-spin" />

              <span className="text-xs font-semibold text-gray-600">
                Installing...
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
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 z-[1000] md:max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="relative flex items-center gap-4 rounded-2xl bg-white p-4 shadow-2xl shadow-black/10 border border-lighter-ash">

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="absolute top-1 right-2 rounded-lg p-1 text-ash hover:bg-lighter-ash hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-0 pr-6">
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

            <div className="min-w-0 font-SFPro">
              <p className="text-sm font-semibold tracking-tight text-foreground truncate">
                Bouwnce App Available
              </p>

              <p className="text-xs text-ash truncate">
                Open app or stay on web
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenApp}
              className="rounded-xl bg-brand-orange px-4 py-2.5 sm:py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm whitespace-nowrap"
            >
              Open App
            </button>

            <button
              type="button"
              onClick={handleContinueWeb}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 sm:py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              Continue on Web
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * ==================================================
   * INSTALL AVAILABLE
   * ==================================================
   *
   * ONLY ONE BUTTON:
   *
   * Install
   */
  if (
    installState === "available" &&
    installPrompt
  ) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 z-[1000] md:max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="relative flex items-center gap-4 rounded-2xl bg-white p-4 shadow-2xl shadow-black/10 border border-lighter-ash">

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close install prompt"
            className="absolute top-1 right-2 rounded-lg p-1 text-ash hover:bg-lighter-ash hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-0 pr-6">
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

            <div className="min-w-0 font-SFPro">
              <p className="text-sm font-semibold tracking-tight text-foreground truncate">
                Get Bouwnce App
              </p>

              <p className="text-xs text-ash truncate">
                Faster access & push notifications
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-xl bg-brand-orange px-5 py-2.5 sm:py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm whitespace-nowrap"
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
