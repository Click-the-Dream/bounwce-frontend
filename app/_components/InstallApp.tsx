"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

interface NavigatorPWA extends Navigator {
  standalone?: boolean;

  getInstalledRelatedApps?: () => Promise<
    Array<{
      platform?: string;
      id?: string;
      url?: string;
    }>
  >;
}

type InstallState =
  | "hidden"
  | "installable"
  | "installing"
  | "installed";

const INSTALLED_KEY = "bouwnce_pwa_installed";
const DISMISS_KEY = "bouwnce_install_popup_dismissed";

export default function InstallApp() {
  const [installState, setInstallState] =
    useState<InstallState>("hidden");

  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isStandalone, setIsStandalone] =
    useState(false);

  /**
   * Prevent the initial installation event from
   * accidentally changing state after unmount.
   */
  const mountedRef = useRef(true);

  /**
   * --------------------------------------------------
   * CHECK STANDALONE
   * --------------------------------------------------
   */
  const isRunningStandalone = () => {
    if (typeof window === "undefined") {
      return false;
    }

    const navigatorPWA =
      navigator as NavigatorPWA;

    return (
      window.matchMedia(
        "(display-mode: standalone)"
      ).matches ||
      window.matchMedia(
        "(display-mode: fullscreen)"
      ).matches ||
      window.matchMedia(
        "(display-mode: minimal-ui)"
      ).matches ||
      navigatorPWA.standalone === true
    );
  };

  /**
   * --------------------------------------------------
   * CHECK INSTALLED RELATED APP
   * --------------------------------------------------
   *
   * Returns:
   *
   * true  = browser confirms installed
   * false = browser confirms not installed
   * null  = browser cannot determine
   */
  const checkInstalledRelatedApp =
    async (): Promise<boolean | null> => {
      if (typeof window === "undefined") {
        return null;
      }

      const navigatorPWA =
        navigator as NavigatorPWA;

      if (
        typeof navigatorPWA.getInstalledRelatedApps !==
        "function"
      ) {
        return null;
      }

      try {
        const installedApps =
          await navigatorPWA.getInstalledRelatedApps();

        console.log(
          "[Bouwnce PWA] Installed related apps:",
          installedApps
        );

        return installedApps.length > 0;
      } catch (error) {
        console.debug(
          "[Bouwnce PWA] Could not check installed apps:",
          error
        );

        return null;
      }
    };

  /**
   * --------------------------------------------------
   * EFFECT
   * --------------------------------------------------
   */
  useEffect(() => {
    mountedRef.current = true;

    if (typeof window === "undefined") {
      return;
    }

    /**
     * ------------------------------------------------
     * CURRENT DISPLAY MODE
     * ------------------------------------------------
     */
    const standalone = isRunningStandalone();

    if (standalone) {
      setIsStandalone(true);
      setInstallState("hidden");

      return () => {
        mountedRef.current = false;
      };
    }

    setIsStandalone(false);

    /**
     * ------------------------------------------------
     * SESSION DISMISS
     * ------------------------------------------------
     *
     * This only prevents the popup for the current
     * browser session/tab.
     *
     * It does NOT mean the app is installed.
     */
    const dismissedThisSession =
      sessionStorage.getItem(DISMISS_KEY) ===
      "true";

    /**
     * ------------------------------------------------
     * INITIAL INSTALLATION CHECK
     * ------------------------------------------------
     */
    const initialize = async () => {
      /**
       * Don't do anything if we're already standalone.
       */
      if (isRunningStandalone()) {
        if (mountedRef.current) {
          setIsStandalone(true);
          setInstallState("hidden");
        }

        return;
      }

      /**
       * Check whether we have a previous installation
       * record.
       */
      const previouslyInstalled =
        localStorage.getItem(INSTALLED_KEY) ===
        "true";

      if (!previouslyInstalled) {
        /**
         * Nothing previously installed.
         *
         * Wait for beforeinstallprompt.
         */
        return;
      }

      /**
       * We have an old installation record.
       *
       * Try to verify it.
       */
      const installed =
        await checkInstalledRelatedApp();

      if (!mountedRef.current) {
        return;
      }

      /**
       * Browser explicitly says the app is installed.
       */
      if (installed === true) {
        if (!dismissedThisSession) {
          setInstallState("installed");
        }

        return;
      }

      /**
       * Browser explicitly says it is NOT installed.
       *
       * This is important for your uninstall case.
       */
      if (installed === false) {
        console.log(
          "[Bouwnce PWA] PWA is no longer installed."
        );

        localStorage.removeItem(
          INSTALLED_KEY
        );

        setInstallState("hidden");

        return;
      }

      /**
       * installed === null
       *
       * Browser cannot verify installation.
       *
       * We have to use the previous installation
       * marker as a fallback.
       *
       * This is necessary because there is no universal
       * isPWAInstalled() browser API.
       */
      if (!dismissedThisSession) {
        setInstallState("installed");
      }
    };

    initialize();

    /**
     * ------------------------------------------------
     * BEFORE INSTALL PROMPT
     * ------------------------------------------------
     *
     * This event is extremely important.
     *
     * If this fires, the browser considers the site
     * installable.
     *
     * Therefore an old "installed" marker is stale.
     */
    const handleBeforeInstallPrompt = (
      event: Event
    ) => {
      event.preventDefault();

      if (!mountedRef.current) {
        return;
      }

      const prompt =
        event as BeforeInstallPromptEvent;

      console.log(
        "[Bouwnce PWA] beforeinstallprompt fired"
      );

      /**
       * If the browser is offering installation,
       * remove any stale installation marker.
       */
      localStorage.removeItem(
        INSTALLED_KEY
      );

      /**
       * Save the browser's install prompt.
       */
      setInstallPrompt(prompt);

      /**
       * Show ONLY the Install UI.
       */
      setInstallState("installable");
    };

    /**
     * ------------------------------------------------
     * APP INSTALLED
     * ------------------------------------------------
     *
     * This is the confirmation event.
     */
    const handleAppInstalled = () => {
      if (!mountedRef.current) {
        return;
      }

      console.log(
        "[Bouwnce PWA] appinstalled fired"
      );

      /**
       * Persist that the browser installed it.
       *
       * This is only a hint for future visits.
       */
      localStorage.setItem(
        INSTALLED_KEY,
        "true"
      );

      /**
       * Clear any session dismissal.
       */
      sessionStorage.removeItem(
        DISMISS_KEY
      );

      /**
       * Consume the prompt.
       */
      setInstallPrompt(null);

      /**
       * IMPORTANT:
       *
       * Don't immediately show "Open App".
       *
       * The user just installed it.
       *
       * Hide the popup. On the next normal browser
       * visit we will show Open App.
       */
      setInstallState("hidden");
    };

    /**
     * ------------------------------------------------
     * VISIBILITY CHANGE
     * ------------------------------------------------
     */
    const handleVisibilityChange = () => {
      if (
        document.visibilityState !== "visible"
      ) {
        return;
      }

      /**
       * Give Chrome a moment to update its PWA state.
       */
      window.setTimeout(async () => {
        if (!mountedRef.current) {
          return;
        }

        /**
         * If this page is now running standalone,
         * hide everything.
         */
        if (isRunningStandalone()) {
          setIsStandalone(true);
          setInstallState("hidden");
          setInstallPrompt(null);

          return;
        }

        /**
         * Don't force state changes for an installable
         * prompt currently being displayed.
         */
        if (installPrompt) {
          return;
        }

        /**
         * If we have a persistent installation record,
         * try to verify it.
         */
        const previouslyInstalled =
          localStorage.getItem(
            INSTALLED_KEY
          ) === "true";

        if (!previouslyInstalled) {
          return;
        }

        const installed =
          await checkInstalledRelatedApp();

        if (!mountedRef.current) {
          return;
        }

        if (installed === false) {
          /**
           * PWA has been uninstalled.
           */
          localStorage.removeItem(
            INSTALLED_KEY
          );

          setInstallState("hidden");

          return;
        }

        if (
          installed === true ||
          installed === null
        ) {
          /**
           * Still installed or browser can't verify.
           */
          if (
            sessionStorage.getItem(
              DISMISS_KEY
            ) !== "true"
          ) {
            setInstallState("installed");
          }
        }
      }, 500);
    };

    /**
     * ------------------------------------------------
     * DISPLAY MODE CHANGE
     * ------------------------------------------------
     */
    const mediaQuery = window.matchMedia(
      "(display-mode: standalone)"
    );

    const handleDisplayModeChange = (
      event: MediaQueryListEvent
    ) => {
      if (!mountedRef.current) {
        return;
      }

      if (event.matches) {
        setIsStandalone(true);
        setInstallState("hidden");
        setInstallPrompt(null);
      } else {
        setIsStandalone(false);
      }
    };

    /**
     * ------------------------------------------------
     * EVENT LISTENERS
     * ------------------------------------------------
     */
    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      "appinstalled",
      handleAppInstalled
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    mediaQuery.addEventListener(
      "change",
      handleDisplayModeChange
    );

    /**
     * ------------------------------------------------
     * CLEANUP
     * ------------------------------------------------
     */
    return () => {
      mountedRef.current = false;

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
  }, []);

  /**
   * --------------------------------------------------
   * INSTALL BUTTON
   * --------------------------------------------------
   */
  const handleInstall = async () => {
    if (!installPrompt) {
      console.warn(
        "[Bouwnce PWA] No install prompt available"
      );

      return;
    }

    /**
     * Immediately show Installing...
     */
    setInstallState("installing");

    try {
      /**
       * Open native browser installation dialog.
       */
      await installPrompt.prompt();

      /**
       * Wait for the browser's response.
       */
      const choice =
        await installPrompt.userChoice;

      console.log(
        "[Bouwnce PWA] Install choice:",
        choice.outcome
      );

      /**
       * User cancelled.
       */
      if (choice.outcome === "dismissed") {
        setInstallPrompt(null);
        setInstallState("hidden");

        return;
      }

      /**
       * User accepted.
       *
       * DO NOT mark installed here.
       *
       * We wait for appinstalled.
       */
      console.log(
        "[Bouwnce PWA] User accepted installation. Waiting for appinstalled..."
      );

      /**
       * Keep showing Installing...
       */
    } catch (error) {
      console.error(
        "[Bouwnce PWA] Install failed:",
        error
      );

      setInstallPrompt(null);
      setInstallState("hidden");
    }
  };

  /**
   * --------------------------------------------------
   * OPEN APP
   * --------------------------------------------------
   */
  const handleOpenApp = () => {
    /**
     * This should match the protocol registered
     * for your Bouwnce PWA if you have one.
     */
    window.location.href =
      "web+bouwnce://open";
  };

  /**
   * --------------------------------------------------
   * CONTINUE ON WEB
   * --------------------------------------------------
   */
  const handleContinueWeb = () => {
    /**
     * Don't delete the installation state.
     *
     * Only dismiss for this session.
     */
    sessionStorage.setItem(
      DISMISS_KEY,
      "true"
    );

    setInstallState("hidden");
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

    setInstallState("hidden");
  };

  /**
   * --------------------------------------------------
   * DON'T SHOW INSIDE PWA
   * --------------------------------------------------
   */
  if (isStandalone) {
    return null;
  }

  if (installState === "hidden") {
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

              <p className="mt-1 text-xs leading-4 text-ash">
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
   * INSTALL AVAILABLE
   * ==================================================
   */
  if (
    installState === "installable" &&
    installPrompt
  ) {
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
                Get Bouwnce App
              </p>

              <p className="mt-1 text-xs leading-4 text-ash">
                Faster access and push notifications.
              </p>
            </div>

            {/* ONLY INSTALL */}
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

            {/* Logo + text */}
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-7 sm:pr-0">

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

                <p className="mt-1 text-xs leading-4 text-ash">
                  Open the Bouwnce app or continue using the web version.
                </p>
              </div>

            </div>

            div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2 shrink-0">

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

  return null;
}
