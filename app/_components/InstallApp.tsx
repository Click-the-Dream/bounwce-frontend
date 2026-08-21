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
  const [state, setState] = useState<InstallState>("hidden");
  const [prompt, setPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const mounted = useRef(true);

  const isStandalone = () => {
    if (typeof window === "undefined") return false;

    const nav = navigator as NavigatorPWA;

    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches ||
      nav.standalone === true
    );
  };

  const checkInstalled = async (): Promise<boolean | null> => {
    const nav = navigator as NavigatorPWA;

    if (!nav.getInstalledRelatedApps) return null;

    try {
      const apps = await nav.getInstalledRelatedApps();
      return apps.length > 0;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    mounted.current = true;

    if (isStandalone()) {
      setStandalone(true);
      return () => {
        mounted.current = false;
      };
    }

    const dismissed =
      sessionStorage.getItem(DISMISS_KEY) === "true";

    const initialize = async () => {
      const previouslyInstalled =
        localStorage.getItem(INSTALLED_KEY) === "true";

      if (!previouslyInstalled) return;

      const installed = await checkInstalled();

      if (!mounted.current) return;

      if (installed === false) {
        localStorage.removeItem(INSTALLED_KEY);
        return;
      }

      if (!dismissed) {
        setState("installed");
      }
    };

    initialize();

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();

      const installEvent =
        event as BeforeInstallPromptEvent;

      localStorage.removeItem(INSTALLED_KEY);
      setPrompt(installEvent);
      setState("installable");
    };

    const handleInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "true");
      sessionStorage.removeItem(DISMISS_KEY);
      setPrompt(null);
      setState("hidden");
    };

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;

      setTimeout(async () => {
        if (!mounted.current || isStandalone()) return;

        const previouslyInstalled =
          localStorage.getItem(INSTALLED_KEY) === "true";

        if (!previouslyInstalled) return;

        const installed = await checkInstalled();

        if (!mounted.current) return;

        if (installed === false) {
          localStorage.removeItem(INSTALLED_KEY);
          setState("hidden");
          return;
        }

        if (
          sessionStorage.getItem(DISMISS_KEY) !== "true" &&
          !prompt
        ) {
          setState("installed");
        }
      }, 500);
    };

    const mediaQuery = window.matchMedia(
      "(display-mode: standalone)"
    );

    const handleDisplayMode = (
      event: MediaQueryListEvent
    ) => {
      if (!mounted.current) return;

      if (event.matches) {
        setStandalone(true);
        setState("hidden");
        setPrompt(null);
      } else {
        setStandalone(false);
      }
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstall
    );

    window.addEventListener(
      "appinstalled",
      handleInstalled
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    mediaQuery.addEventListener(
      "change",
      handleDisplayMode
    );

    return () => {
      mounted.current = false;

      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstall
      );

      window.removeEventListener(
        "appinstalled",
        handleInstalled
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );

      mediaQuery.removeEventListener(
        "change",
        handleDisplayMode
      );
    };
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;

    setState("installing");

    try {
      await prompt.prompt();

      const choice = await prompt.userChoice;

      if (choice.outcome === "dismissed") {
        setPrompt(null);
        setState("hidden");
      }
    } catch {
      setPrompt(null);
      setState("hidden");
    }
  };

  const handleOpenApp = () => {
    window.location.href = "web+bouwnce://open";
  };

  const handleContinueWeb = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setState("hidden");
  };

  const handleClose = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setState("hidden");
  };

  if (standalone || state === "hidden") return null;

  if (state === "installing") {
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

            <span className="shrink-0 flex h-9 items-center gap-2 rounded-xl bg-gray-100 px-3 text-xs font-semibold text-gray-600">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-brand-orange animate-spin" />
              <span className="hidden sm:inline">
                Installing...
              </span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (state === "installable" && prompt) {
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

  if (state === "installed") {
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
