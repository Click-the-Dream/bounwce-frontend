"use client";

import { X, Share, PlusSquare } from "lucide-react";

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
}

type InstallState = "hidden" | "installable" | "ios-installable" | "installing";

const DISMISS_KEY = "bouwnce_install_popup_dismissed";

const INITIAL_DELAY_MS = 3000;

export default function InstallApp() {
  const [state, setState] = useState<InstallState>("hidden");

  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const [standalone, setStandalone] = useState(false);

  const [isIOSDevice, setIsIOSDevice] = useState(false);

  const [isIOSSafariDevice, setIsIOSSafariDevice] = useState(false);

  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  const mounted = useRef(false);

  const justInstalled = useRef(false);

  const isStandalone = (): boolean => {
    if (typeof window === "undefined") {
      return false;
    }

    const nav = navigator as NavigatorPWA;

    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches ||
      nav.standalone === true
    );
  };

  const detectIOS = (): boolean => {
    if (typeof window === "undefined") {
      return false;
    }

    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  };

  const detectIOSSafari = (): boolean => {
    if (typeof window === "undefined") {
      return false;
    }

    const ua = navigator.userAgent;

    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    const safari =
      /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA/.test(ua);

    return ios && safari;
  };

  /**
   * Hide everything while running inside the
   * actual installed PWA.
   */
  const hideForStandalone = () => {
    setStandalone(true);
    setState("hidden");

    promptRef.current = null;
    setPrompt(null);

    sessionStorage.removeItem(DISMISS_KEY);
  };

  /**
   * Decide which installation UI should be shown.
   *
   * There is intentionally NO "installed" or
   * "open-app" state anymore.
   */
  const syncBrowserState = () => {
    if (!mounted.current || typeof window === "undefined") {
      return;
    }

    if (isStandalone()) {
      hideForStandalone();
      return;
    }

    setStandalone(false);

    /**
     * Don't let focus / visibility events
     * immediately bring the banner back after
     * an accepted installation.
     */
    if (justInstalled.current) {
      setState("hidden");
      return;
    }

    const dismissed = sessionStorage.getItem(DISMISS_KEY) === "true";

    if (dismissed) {
      setState("hidden");
      return;
    }

    /**
     * iOS Safari uses manual installation
     * instructions.
     */
    if (isIOSSafariDevice) {
      setState("ios-installable");
      return;
    }

    /**
     * Chromium native installation prompt.
     */
    if (promptRef.current) {
      setState("installable");
      return;
    }

    /**
     * Nothing to show.
     */
    setState("hidden");
  };

  useEffect(() => {
    mounted.current = true;

    const ios = detectIOS();
    const safari = detectIOSSafari();

    setIsIOSDevice(ios);
    setIsIOSSafariDevice(safari);

    let delayTimer: ReturnType<typeof setTimeout>;

    /**
     * Delay initial UI.
     */
    delayTimer = setTimeout(() => {
      syncBrowserState();
    }, INITIAL_DELAY_MS);

    /**
     * Browser says the site can be installed.
     */
    const handleBeforeInstallPrompt = (event: Event) => {
      if (!mounted.current) {
        return;
      }

      event.preventDefault();

      const installEvent = event as BeforeInstallPromptEvent;

      promptRef.current = installEvent;

      setPrompt(installEvent);

      justInstalled.current = false;

      /**
       * A fresh installation prompt means
       * the browser currently considers the
       * website installable.
       */
      sessionStorage.removeItem(DISMISS_KEY);

      if (isStandalone()) {
        hideForStandalone();
        return;
      }

      setStandalone(false);
      setState("installable");
    };

    /**
     * Browser confirms that installation
     * completed.
     */
    const handleInstalled = () => {
      if (!mounted.current) {
        return;
      }

      console.log("[PWA] Installation completed");

      promptRef.current = null;
      setPrompt(null);

      /**
       * Hide immediately.
       */
      setState("hidden");

      /**
       * Prevent the focus/visibility events
       * generated during installation from
       * immediately showing the banner again.
       */
      justInstalled.current = true;

      window.setTimeout(() => {
        justInstalled.current = false;
      }, 2000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      window.setTimeout(() => {
        syncBrowserState();
      }, 200);
    };

    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      if (!mounted.current) {
        return;
      }

      if (event.matches) {
        hideForStandalone();
        return;
      }

      setStandalone(false);

      window.setTimeout(() => {
        syncBrowserState();
      }, 200);
    };

    const handleFocus = () => {
      window.setTimeout(() => {
        syncBrowserState();
      }, 200);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", handleInstalled);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    window.addEventListener("focus", handleFocus);

    mediaQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      mounted.current = false;

      clearTimeout(delayTimer);

      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );

      window.removeEventListener("appinstalled", handleInstalled);

      document.removeEventListener("visibilitychange", handleVisibilityChange);

      window.removeEventListener("focus", handleFocus);

      mediaQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, [isIOSSafariDevice]);

  /**
   * Trigger native installation.
   */
  const handleInstall = async () => {
    const installPrompt = promptRef.current;

    if (!installPrompt) {
      console.log("[PWA] Native install prompt unavailable");
      return;
    }

    setState("installing");

    try {
      await installPrompt.prompt();

      const choice = await installPrompt.userChoice;

      console.log("[PWA] Install result:", choice.outcome);

      promptRef.current = null;
      setPrompt(null);

      if (choice.outcome === "accepted") {
        /**
         * appinstalled will normally fire.
         */
        setState("hidden");
      } else {
        setState("hidden");
      }
    } catch (error) {
      console.error("[PWA] Install prompt failed:", error);

      promptRef.current = null;
      setPrompt(null);

      setState("hidden");
    }
  };

  /**
   * iOS installation confirmation.
   *
   * This doesn't pretend to know whether the
   * user really installed it. It simply hides
   * the instructions for this session.
   */
  const handleIOSInstalled = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");

    setState("hidden");
  };

  /**
   * Close the banner for this session.
   */
  const handleClose = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");

    setState("hidden");
  };

  /**
   * Never render inside the standalone PWA.
   */
  if (standalone || isStandalone() || state === "hidden") {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="App Installation Prompt"
      aria-live="polite"
      className="fixed bottom-4 left-3 right-3 z-[1000] pointer-events-none sm:left-4 sm:right-4 md:left-auto md:right-6 md:max-w-lg"
    >
      <div className="relative rounded-2xl bg-white p-4 shadow-2xl shadow-black/10 border border-lighter-ash pointer-events-auto">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-1.5 right-2 rounded-lg p-1 text-ash transition-colors hover:bg-lighter-ash hover:text-foreground focus:outline-none focus:ring-2 focus:ring-black/10"
        >
          <X size={16} />
        </button>

        {state === "installing" && (
          <div className="flex items-center gap-3 pr-7">
            <AppIcon />

            <div className="min-w-0 flex-1 font-SFPro">
              <p className="text-sm font-semibold text-foreground">
                Installing Bouwnce...
              </p>

              <p className="mt-1 text-xs leading-4 text-ash">
                Please wait while the app is being installed.
              </p>
            </div>

            <span className="shrink-0 flex h-9 items-center gap-2 rounded-xl bg-gray-100 px-3 text-xs font-semibold text-gray-600">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-brand-orange animate-spin" />

              <span className="hidden sm:inline">Installing...</span>
            </span>
          </div>
        )}

        {state === "ios-installable" && (
          <div className="flex items-start gap-3 pr-7">
            <AppIcon />

            <div className="min-w-0 flex-1 font-SFPro">
              <p className="text-sm font-semibold text-foreground">
                Get Bouwnce App
              </p>

              <p className="mt-1 text-xs leading-4 text-ash">
                Install Bouwnce on your iPhone for faster access and push
                notifications.
              </p>

              <div className="mt-3 space-y-2.5">
                <StepInstruction icon={<Share size={14} />}>
                  Tap the <strong>Share</strong> button in Safari.
                </StepInstruction>

                <StepInstruction icon={<PlusSquare size={14} />}>
                  Tap <strong>Add to Home Screen</strong>.
                </StepInstruction>

                <StepInstruction
                  icon={<span className="font-bold text-green-600">✓</span>}
                >
                  Tap <strong>Add</strong> to finish.
                </StepInstruction>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleIOSInstalled}
                  className="flex-1 rounded-xl bg-brand-orange px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
                >
                  I've Added Bouwnce
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl bg-lighter-ash px-4 py-2.5 text-xs font-semibold text-foreground transition-all hover:opacity-90 active:scale-95"
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>
        )}

        {state === "installable" && prompt && (
          <div className="flex items-center gap-3 pr-7">
            <AppIcon />

            <div className="min-w-0 flex-1 font-SFPro">
              <p className="text-sm font-semibold text-foreground">
                Get Bouwnce App
              </p>

              <p className="mt-1 text-xs leading-4 text-ash">
                Faster access and push notifications.
              </p>
            </div>

            <button
              type="button"
              onClick={handleInstall}
              className="shrink-0 rounded-xl bg-brand-orange px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 whitespace-nowrap sm:py-2"
            >
              Install
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AppIcon() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lighter-ash/60 sm:h-12 sm:w-12">
      <Image
        src="/icon.png"
        alt="Bouwnce Logo"
        width={28}
        height={28}
        priority
        className="h-7 w-7 object-contain"
      />
    </div>
  );
}

function StepInstruction({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-foreground">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lighter-ash/70">
        {icon}
      </span>

      <span>{children}</span>
    </div>
  );
}
