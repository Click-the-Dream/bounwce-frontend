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
  | "hidden"
  | "installable"
  | "installing"
  | "installed";

const INSTALLED_KEY = "bouwnce_app_installed";
const DISMISS_KEY = "bouwnce_install_popup_dismissed";

export default function InstallApp() {
  const [installState, setInstallState] =
    useState<InstallState>("hidden");

  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isStandalone, setIsStandalone] =
    useState(false);

  /**
   * Check whether the website is currently
   * running inside the installed PWA.
   */
  const checkStandalone = () => {
    if (typeof window === "undefined") {
      return false;
    }

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
      (navigator as Navigator & {
        standalone?: boolean;
      }).standalone === true
    );
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    /**
     * ------------------------------------------------
     * INITIAL CHECK
     * ------------------------------------------------
     */
    const standalone = checkStandalone();

    if (standalone) {
      setIsStandalone(true);
      setInstallState("hidden");

      return;
    }

    setIsStandalone(false);

    /**
     * IMPORTANT:
     *
     * We only use this flag on a NEW browser page load.
     *
     * appinstalled from the previous tab has already
     * saved it.
     */
    const wasInstalled =
      localStorage.getItem(INSTALLED_KEY) === "true";

    /**
     * Don't let a previous "Continue on Web"
     * permanently suppress the popup.
     *
     * sessionStorage only lasts for the browser tab/session.
     */
    const dismissed =
      sessionStorage.getItem(DISMISS_KEY) === "true";

    /**
     * If the PWA was installed previously, show:
     *
     * Open App | Continue on Web
     */
    if (wasInstalled && !dismissed) {
      setInstallState("installed");
    }

    const handleBeforeInstallPrompt = (
      event: Event
    ) => {
      event.preventDefault();

      const prompt =
        event as BeforeInstallPromptEvent;

      /**
       * If we already know the app is installed,
       * don't show Install.
       */
      const installed =
        localStorage.getItem(
          INSTALLED_KEY
        ) === "true";

      if (installed) {
        return;
      }

      /**
       * Browser says this PWA can be installed.
       */
      setInstallPrompt(prompt);
      setInstallState("installable");
    };

    /**
     * ------------------------------------------------
     * APP INSTALLED
     * ------------------------------------------------
     */
    const handleAppInstalled = () => {
      console.log(
        "Bouwnce PWA installation confirmed"
      );

      /**
       * THIS IS THE IMPORTANT PART.
       *
       * Persist the fact that the PWA was actually
       * installed.
       */
      localStorage.setItem(
        INSTALLED_KEY,
        "true"
      );

      /**
       * Consume the install prompt.
       */
      setInstallPrompt(null);

      /**
       * DO NOT show Open App immediately.
       *
       * Hide this popup.
       *
       * The next browser tab/page load will read
       * INSTALLED_KEY and show Open App.
       */
      setInstallState("hidden");
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
      if (event.matches) {
        /**
         * We are inside the installed PWA.
         */
        setIsStandalone(true);
        setInstallState("hidden");
        setInstallPrompt(null);
      } else {
        setIsStandalone(false);
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

      mediaQuery.removeEventListener(
        "change",
        handleDisplayModeChange
      );
    };
  }, []);

  /**
   * ------------------------------------------------
   * INSTALL
   * ------------------------------------------------
   */
  const handleInstall = async () => {
    if (!installPrompt) {
      console.warn(
        "beforeinstallprompt is not available"
      );

      return;
    }

    /**
     * Immediately show Installing...
     */
    setInstallState("installing");

    try {
      /**
       * Open native browser installation prompt.
       */
      await installPrompt.prompt();

      /**
       * Wait for user's choice.
       */
      const choice =
        await installPrompt.userChoice;

      console.log(
        "Install choice:",
        choice.outcome
      );

      if (choice.outcome === "dismissed") {
        setInstallPrompt(null);
        setInstallState("hidden");

        return;
      }
      
      console.log(
        "User accepted installation. Waiting for appinstalled..."
      );
    } catch (error) {
      console.error(
        "Installation failed:",
        error
      );

      setInstallPrompt(null);
      setInstallState("hidden");
    }
  };

  const handleOpenApp = () => {
    /**
     * Your registered PWA/custom protocol.
     */
    window.location.href =
      "web+bouwnce://open";
  };

  const handleContinueWeb = () => {
    sessionStorage.setItem(
      DISMISS_KEY,
      "true"
    );

    setInstallState("hidden");
  };

  const handleClose = () => {
    sessionStorage.setItem(
      DISMISS_KEY,
      "true"
    );

    setInstallState("hidden");
  };

  if (isStandalone) {
    return null;
  }


  if (installState === "hidden") {
    return null;
  }

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

              <p className="mt-0.5 text-xs leading-4 text-ash">
                Faster access and push notifications.
              </p>
            </div>

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

            {/* Buttons */}
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

  return null;
}
