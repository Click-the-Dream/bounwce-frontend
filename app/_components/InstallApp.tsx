"use client";

import { X, Share, PlusSquare, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

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

interface NavigatorInstalledApps extends Navigator {
  getInstalledRelatedApps?: () => Promise<
    Array<{
      platform: string;
      id?: string;
      url?: string;
    }>
  >;
}

type InstallState =
  | "hidden"
  | "installable"
  | "ios-installable"
  | "installing"
  | "open-app";

const DISMISS_KEY = "bouwnce_install_popup_dismissed";
const INSTALLED_KEY = "bouwnce_pwa_installed";

export default function InstallApp() {
  const [state, setState] = useState<InstallState>("hidden");
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(false);

  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const mounted = useRef(false);

  const isStandalone = useCallback((): boolean => {
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
  }, []);
  const detectIOS = useCallback((): boolean => {
    if (typeof window === "undefined") {
      return false;
    }

    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }, []);

  const detectIOSSafari = useCallback((): boolean => {
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
  }, []);

  const hasInstalledMarker = useCallback((): boolean => {
    if (typeof window === "undefined") {
      return false;
    }

    return localStorage.getItem(INSTALLED_KEY) === "true";
  }, []);

  const hideForStandalone = useCallback(() => {
    setStandalone(true);
    setState("hidden");

    promptRef.current = null;
    setPrompt(null);

    sessionStorage.removeItem(DISMISS_KEY);
  }, []);

  const syncBrowserState = useCallback(() => {
    if (!mounted.current || typeof window === "undefined") {
      return;
    }

    const standaloneNow = isStandalone();

    if (standaloneNow) {
      hideForStandalone();
      return;
    }

    setStandalone(false);

    const dismissed = sessionStorage.getItem(DISMISS_KEY) === "true";

    if (hasInstalledMarker()) {
      if (!dismissed) {
        setState("open-app");
      } else {
        setState("hidden");
      }

      return;
    }

    if (promptRef.current) {
      if (!dismissed) {
        setState("installable");
      } else {
        setState("hidden");
      }

      return;
    }

    if (isIOSSafari) {
      if (!dismissed) {
        setState("ios-installable");
      } else {
        setState("hidden");
      }

      return;
    }

    setState("hidden");
  }, [hasInstalledMarker, hideForStandalone, isIOSSafari, isStandalone]);

  const checkInstalledRelatedApps = useCallback(async () => {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      const nav = navigator as NavigatorInstalledApps;

      if (typeof nav.getInstalledRelatedApps !== "function") {
        return false;
      }

      const apps = await nav.getInstalledRelatedApps();

      if (apps.length > 0) {
        localStorage.setItem(INSTALLED_KEY, "true");
        return true;
      }
    } catch (error) {
      console.log("[PWA] Could not check installed related apps:", error);
    }

    return false;
  }, []);

  useEffect(() => {
    mounted.current = true;

    const ios = detectIOS();
    const safari = detectIOSSafari();

    setIsIOSDevice(ios);
    setIsIOSSafari(safari);

    syncBrowserState();

    const handleBeforeInstallPrompt = (event: Event) => {
      if (!mounted.current) {
        return;
      }

      event.preventDefault();

      const installEvent = event as BeforeInstallPromptEvent;

      console.log("[PWA] beforeinstallprompt fired.");

      promptRef.current = installEvent;
      setPrompt(installEvent);

      if (!isStandalone()) {
        localStorage.removeItem(INSTALLED_KEY);
      }

      sessionStorage.removeItem(DISMISS_KEY);

      if (isStandalone()) {
        hideForStandalone();
        return;
      }

      setStandalone(false);
      setState("installable");
    };

    const handleInstalled = () => {
      if (!mounted.current) {
        return;
      }

      console.log("[PWA] appinstalled fired.");

      localStorage.setItem(INSTALLED_KEY, "true");

      promptRef.current = null;
      setPrompt(null);

      setState("hidden");

      sessionStorage.removeItem(DISMISS_KEY);
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
        console.log("[PWA] Entered standalone Bouwnce app.");

        localStorage.setItem(INSTALLED_KEY, "true");

        hideForStandalone();

        return;
      }

      console.log("[PWA] Returned to browser.");

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
    void checkInstalledRelatedApps().then((installed) => {
      if (!mounted.current) {
        return;
      }

      if (installed && !isStandalone()) {
        syncBrowserState();
      }
    });

    return () => {
      mounted.current = false;

      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );

      window.removeEventListener("appinstalled", handleInstalled);

      document.removeEventListener("visibilitychange", handleVisibilityChange);

      window.removeEventListener("focus", handleFocus);

      mediaQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, [
    checkInstalledRelatedApps,
    detectIOS,
    detectIOSSafari,
    hideForStandalone,
    isStandalone,
    syncBrowserState,
  ]);

  const handleInstall = async () => {
    const installPrompt = promptRef.current;

    if (!installPrompt) {
      console.log("[PWA] No beforeinstallprompt event available.");
      return;
    }

    setState("installing");

    try {
      await installPrompt.prompt();

      const choice = await installPrompt.userChoice;

      console.log("[PWA] Install result:", choice.outcome);

      /**
       * beforeinstallprompt can only be used once.
       */
      promptRef.current = null;
      setPrompt(null);

      if (choice.outcome === "accepted") {
        console.log("[PWA] Installation accepted.");

        localStorage.setItem(INSTALLED_KEY, "true");

        setState("hidden");

        sessionStorage.removeItem(DISMISS_KEY);
      } else {
        console.log("[PWA] Installation dismissed.");

        setState("hidden");
      }
    } catch (error) {
      console.error("[PWA] Install prompt failed:", error);

      promptRef.current = null;
      setPrompt(null);

      setState("hidden");
    }
  };

  const handleIOSInstalled = () => {
    localStorage.setItem(INSTALLED_KEY, "true");

    sessionStorage.removeItem(DISMISS_KEY);

    setState("hidden");

    console.log("[PWA] iOS installation confirmed by user.");
  };

  const handleOpenApp = () => {
    console.log("[PWA] Attempting to open Bouwnce app.");

    try {
      window.location.href = "web+bouwnce://open";
    } catch (error) {
      console.error("[PWA] Could not open Bouwnce app:", error);
    }
  };

  const handleContinueWeb = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setState("hidden");
  };

  const handleClose = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setState("hidden");
  };

  if (standalone || isStandalone()) {
    return null;
  }

  if (state === "hidden") {
    return null;
  }

  if (state === "installing") {
    return (
      <div className="fixed bottom-4 left-3 right-3 sm:left-4 sm:right-4 md:left-auto md:right-6 z-1000 md:max-w-lg">
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
                className="h-7 w-7 object-contain"
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

            <span className="shrink-0 flex h-9 items-center gap-2 rounded-xl bg-gray-100 px-3 text-xs font-semibold text-gray-600">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-brand-orange animate-spin" />
              <span className="hidden sm:inline">Installing...</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (state === "ios-installable") {
    return (
      <div className="fixed bottom-4 left-3 right-3 sm:left-4 sm:right-4 md:left-auto md:right-6 z-1000 md:max-w-lg">
        <div className="relative rounded-2xl bg-white p-4 shadow-2xl shadow-black/10 border border-lighter-ash">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="absolute top-1.5 right-2 rounded-lg p-1 text-ash hover:bg-lighter-ash hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-3 pr-7">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-lighter-ash/60">
              <Image
                src="/icon.png"
                alt="Bouwnce Logo"
                width={28}
                height={28}
                priority
                className="h-7 w-7 object-contain"
              />
            </div>

            <div className="min-w-0 flex-1 font-SFPro">
              <p className="text-sm font-semibold text-foreground">
                Get Bouwnce App
              </p>

              <p className="mt-1 text-xs leading-4 text-ash">
                Install Bouwnce on your iPhone for faster access and push
                notifications.
              </p>

              <div className="mt-3 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lighter-ash/70">
                    <Share size={14} />
                  </span>

                  <span>
                    Tap the <strong>Share</strong> button in Safari.
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-foreground">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lighter-ash/70">
                    <PlusSquare size={14} />
                  </span>

                  <span>
                    Tap <strong>Add to Home Screen</strong>.
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-foreground">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lighter-ash/70 text-green-600 font-bold">
                    ✓
                  </span>

                  <span>
                    Tap <strong>Add</strong> to finish.
                  </span>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleIOSInstalled}
                  className="flex-1 rounded-xl bg-brand-orange px-4 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm"
                >
                  I've Added Bouwnce
                </button>

                <button
                  type="button"
                  onClick={handleContinueWeb}
                  className="rounded-xl bg-lighter-ash px-4 py-2.5 text-xs font-semibold text-foreground transition-all hover:opacity-90 active:scale-95"
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === "installable" && prompt) {
    return (
      <div className="fixed bottom-4 left-3 right-3 sm:left-4 sm:right-4 md:left-auto md:right-6 z-1000 md:max-w-lg">
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
                className="h-7 w-7 object-contain"
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

  if (state === "open-app") {
    return (
      <div className="fixed bottom-4 left-3 right-3 sm:left-4 sm:right-4 md:left-auto md:right-6 z-1000 md:max-w-lg">
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
                className="h-7 w-7 object-contain"
              />
            </div>

            <div className="min-w-0 flex-1 font-SFPro">
              <p className="text-sm font-semibold text-foreground">
                Open Bouwnce App
              </p>

              <p className="mt-1 text-xs leading-4 text-ash">
                Bouwnce is already installed on this device.
              </p>
            </div>

            {isIOSDevice ? (
              <button
                type="button"
                onClick={handleContinueWeb}
                className="shrink-0 rounded-xl bg-brand-orange px-4 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm whitespace-nowrap"
              >
                Open from Home Screen
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenApp}
                className="shrink-0 flex items-center gap-1.5 rounded-xl bg-brand-orange px-4 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm whitespace-nowrap"
              >
                <ExternalLink size={14} />
                Open App
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
