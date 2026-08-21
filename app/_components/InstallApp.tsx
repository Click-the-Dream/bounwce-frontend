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
   * Check whether Bouwnce is currently running
   * inside an installed PWA.
   */
  const checkStandalone = () => {
    if (typeof window === "undefined") {
      return false;
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & {
        standalone?: boolean;
      }).standalone === true;

    setIsStandalone(standalone);

    return standalone;
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    /**
     * If we're already inside the installed PWA,
     * there is nothing to show.
     */
    if (checkStandalone()) {
      setInstallState("idle");
      return;
    }

    /**
     * Browser has determined that the website
     * can be installed.
     */
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      const promptEvent =
        event as BeforeInstallPromptEvent;

      setInstallPrompt(promptEvent);

      /**
       * The app is not currently running standalone.
       */
      setIsStandalone(false);

      /**
       * Installation is available.
       */
      setInstallState("available");
    };

    /**
     * This is the ONLY event we use to determine
     * that installation has actually completed.
     */
    const handleAppInstalled = () => {
      console.log("Bouwnce appinstalled event fired");

      setInstallPrompt(null);

      /**
       * Now, and only now, do we consider the app
       * installed.
       */
      setInstallState("installed");

      /**
       * Clear any previous dismissal.
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
     * Check again after the browser has initialized
     * the display mode.
     */
    const timer = window.setTimeout(() => {
      if (checkStandalone()) {
        setInstallState("idle");
        setInstallPrompt(null);
      }
    }, 1000);

    /**
     * Handle returning to the website.
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const standalone = checkStandalone();

      if (standalone) {
        /**
         * We are inside the installed PWA.
         */
        setInstallState("idle");
        setInstallPrompt(null);

        return;
      }

      /**
       * Don't change "installed" here.
       *
       * If appinstalled has just fired, we want to keep
       * showing the Open App UI.
       */
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    /**
     * Watch for display-mode changes.
     */
    const mediaQuery = window.matchMedia(
      "(display-mode: standalone)"
    );

    const handleDisplayModeChange = (
      event: MediaQueryListEvent
    ) => {
      const standalone =
        event.matches ||
        (navigator as Navigator & {
          standalone?: boolean;
        }).standalone === true;

      setIsStandalone(standalone);

      if (standalone) {
        setInstallState("idle");
        setInstallPrompt(null);
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
   * Start the native installation flow.
   */
  const handleInstall = async () => {
    if (!installPrompt) {
      console.warn(
        "beforeinstallprompt is not available"
      );

      return;
    }

    /**
     * IMPORTANT:
     *
     * Immediately show "Installing..."
     *
     * We do NOT change this to "installed" here.
     */
    setInstallState("installing");

    try {
      /**
       * Open the browser's native installation UI.
       */
      await installPrompt.prompt();

      /**
       * Wait for the actual user's decision.
       */
      const choice =
        await installPrompt.userChoice;

      console.log(
        "Install prompt result:",
        choice.outcome
      );

      if (choice.outcome === "accepted") {
        /**
         * The user approved installation.
         *
         * IMPORTANT:
         *
         * Do NOT set "installed" here.
         *
         * We wait for the browser's `appinstalled`
         * event.
         */
        console.log(
          "Installation accepted. Waiting for appinstalled..."
        );

        /**
         * Keep:
         *
         * Installing...
         *
         * until the browser confirms installation.
         */
      } else {
        /**
         * User dismissed the native installation dialog.
         */
        console.log(
          "User dismissed installation."
        );

        setInstallState("available");

        /**
         * Don't permanently suppress the prompt.
         */
        sessionStorage.removeItem(DISMISS_KEY);
      }
    } catch (error) {
      console.error(
        "Failed to install Bouwnce:",
        error
      );

      /**
       * Installation failed/cancelled.
       */
      setInstallState("available");
    } finally {
      /**
       * The beforeinstallprompt event is one-shot.
       */
      setInstallPrompt(null);
    }
  };

  /**
   * Open the installed Bouwnce application.
   */
  const handleOpenApp = () => {
    window.location.href =
      "web+bouwnce://open";
  };

  /**
   * Continue using Bouwnce in the browser.
   */
  const handleContinueWeb = () => {
    sessionStorage.setItem(
      DISMISS_KEY,
      "true"
    );

    setInstallState("idle");
  };

  /**
   * Close the popup.
   */
  const handleClose = () => {
    sessionStorage.setItem(
      DISMISS_KEY,
      "true"
    );

    setInstallState("idle");
  };

  /**
   * Never show the popup when running inside
   * the installed PWA.
   */
  if (isStandalone) {
    return null;
  }

  /**
   * Nothing to show.
   */
  if (installState === "idle") {
    return null;
  }

  /**
   * ------------------------------------------------
   * INSTALLING
   * ------------------------------------------------
   *
   * The user has approved installation but the
   * browser has NOT yet confirmed appinstalled.
   */
  if (installState === "installing") {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 z-[1000] md:max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl bg-white p-4 shadow-2xl shadow-black/10 border border-lighter-ash">

          {/* Close */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close install status"
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
                Installing Bouwnce...
              </p>

              <p className="text-xs text-ash truncate">
                Please wait while the app is being installed
              </p>
            </div>
          </div>

          {/* Installing indicator */}
          <div className="w-full sm:w-auto shrink-0">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-5 py-2.5 sm:py-2">
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
   * ------------------------------------------------
   * INSTALLED
   * ------------------------------------------------
   *
   * appinstalled has fired.
   *
   * NOW it is safe to show Open App.
   */
  if (installState === "installed") {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 z-[1000] md:max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl bg-white p-4 shadow-2xl shadow-black/10 border border-lighter-ash">

          {/* Close */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
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
                Bouwnce App Available
              </p>

              <p className="text-xs text-ash truncate">
                Open app or stay on web
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full sm:w-auto shrink-0">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full">

              {/* Open App */}
              <button
                type="button"
                onClick={handleOpenApp}
                className="w-full sm:w-auto rounded-xl bg-brand-orange px-4 py-2.5 sm:py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm text-center whitespace-nowrap"
              >
                Open App
              </button>

              {/* Continue Web */}
              <button
                type="button"
                onClick={handleContinueWeb}
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

  /**
   * ------------------------------------------------
   * AVAILABLE FOR INSTALLATION
   * ------------------------------------------------
   */
  if (
    installState === "available" &&
    installPrompt
  ) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 z-[1000] md:max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl bg-white p-4 shadow-2xl shadow-black/10 border border-lighter-ash">

          {/* Close */}
          <button
            type="button"
            onClick={handleClose}
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
          <div className="w-full sm:w-auto shrink-0">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full">

              {/* Install */}
              <button
                type="button"
                onClick={handleInstall}
                className="w-full sm:w-auto rounded-xl bg-brand-orange px-5 py-2.5 sm:py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm text-center whitespace-nowrap"
              >
                Install
              </button>

              {/* Continue Web */}
              <button
                type="button"
                onClick={handleContinueWeb}
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

  return null;
}
