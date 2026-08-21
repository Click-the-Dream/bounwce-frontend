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

  /**
   * This means the current page is running inside
   * the installed PWA.
   */
  const [isStandalone, setIsStandalone] = useState(false);

  /**
   * This is ONLY a UI state for the current web page.
   *
   * It is intentionally NOT stored in localStorage.
   *
   * After the PWA is uninstalled and the website is
   * opened again, this will naturally start as false.
   */
  const [isInstalled, setIsInstalled] = useState(false);

  /**
   * Check whether the current page is running
   * as an installed PWA.
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
     * don't show the web install banner.
     */
    if (checkStandalone()) {
      setIsInstalled(true);
      setShowBanner(false);
      return;
    }

    /**
     * Browser says the website can be installed.
     */
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      const promptEvent =
        event as BeforeInstallPromptEvent;

      setInstallPrompt(promptEvent);

      /**
       * We are back on the web version, so this is
       * definitely not the standalone PWA.
       */
      setIsStandalone(false);

      /**
       * A previous installation is no longer considered
       * active once we're back on the web.
       */
      setIsInstalled(false);

      /**
       * Only respect dismissal for the current
       * browser session.
       */
      const dismissed =
        sessionStorage.getItem(DISMISS_KEY);

      if (!dismissed) {
        setShowBanner(true);
      }
    };

    /**
     * Browser fires this after successful installation.
     */
    const handleAppInstalled = () => {
      console.log("Bouwnce PWA installed");

      /**
       * Keep the banner visible temporarily.
       *
       * The user is currently on the website, so we
       * can show:
       *
       *   Open App
       *   Continue on Web
       */
      setIsInstalled(true);

      setInstallPrompt(null);

      setShowBanner(true);

      /**
       * Clear dismissal state.
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
     * Check display mode again after the browser
     * has had time to update it.
     */
    const timer = window.setTimeout(() => {
      const standalone = checkStandalone();

      if (standalone) {
        setIsInstalled(true);
        setShowBanner(false);
      }
    }, 1000);

    /**
     * Detect returning to the page.
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const standalone = checkStandalone();

      if (standalone) {
        /**
         * We are inside the PWA.
         */
        setIsInstalled(true);
        setShowBanner(false);

        return;
      }

      /**
       * We are on the web.
       *
       * Don't automatically set isInstalled here because
       * the browser may simply have opened the website.
       *
       * beforeinstallprompt will determine whether the
       * website can currently be installed.
       */
      if (installPrompt) {
        const dismissed =
          sessionStorage.getItem(DISMISS_KEY);

        if (!dismissed) {
          setShowBanner(true);
        }
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    /**
     * Detect display-mode changes.
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
        /**
         * Now running inside the installed app.
         */
        setIsInstalled(true);
        setShowBanner(false);
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
   * Trigger native browser installation.
   */
  const handleInstall = async () => {
    if (!installPrompt) {
      console.warn(
        "beforeinstallprompt is not available"
      );

      return;
    }

    try {
      await installPrompt.prompt();

      const choice =
        await installPrompt.userChoice;

      console.log(
        "Installation result:",
        choice.outcome
      );

      if (choice.outcome === "accepted") {
        /**
         * Don't immediately hide the banner.
         *
         * appinstalled will handle the successful
         * installation state.
         */
        sessionStorage.removeItem(DISMISS_KEY);
      } else {
        /**
         * User rejected the native prompt.
         */
        sessionStorage.setItem(
          DISMISS_KEY,
          "true"
        );

        setShowBanner(false);
      }
    } catch (error) {
      console.error(
        "Failed to install Bouwnce:",
        error
      );
    } finally {
      /**
       * The native prompt can only be used once.
       */
      setInstallPrompt(null);
    }
  };

  /**
   * Open the installed Bouwnce app.
   */
  const handleOpenApp = () => {
    window.location.href =
      "web+bouwnce://open";
  };

  /**
   * Continue using Bouwnce in the browser.
   */
  const handleDismiss = () => {
    sessionStorage.setItem(
      DISMISS_KEY,
      "true"
    );

    setShowBanner(false);
  };

  /**
   * Never display this component inside the
   * installed PWA.
   */
  if (isStandalone) {
    return null;
  }

  /**
   * Nothing to display.
   */
  if (!showBanner) {
    return null;
  }

  /**
   * ------------------------------------------------
   * INSTALLED STATE
   * ------------------------------------------------
   *
   * The app has just been installed, but the user
   * is still viewing the website.
   */
  if (isInstalled && !installPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 z-[1000] md:max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl bg-white p-4 shadow-2xl shadow-black/10 border border-lighter-ash">

          {/* Dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss prompt"
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
          <div className="w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full">

              {/* Open App */}
              <button
                type="button"
                onClick={handleOpenApp}
                className="w-full sm:w-auto rounded-xl bg-brand-orange px-4 py-2.5 sm:py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm text-center whitespace-nowrap"
              >
                Open App
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

  /**
   * ------------------------------------------------
   * INSTALL STATE
   * ------------------------------------------------
   */
  if (installPrompt) {
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

  return null;
            }
