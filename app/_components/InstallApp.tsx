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

export default function InstallApp() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const runningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    if (runningStandalone) {
      setIsStandalone(true);
      return;
    }
    const isDismissed = localStorage.getItem("bouwnce_prompt_dismissed");
    if (isDismissed) return;

    let hasInstallPromptFired = false;

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      hasInstallPromptFired = true;
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setIsInstalled(false);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      localStorage.setItem("bouwnce_app_installed", "true");
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    const timer = setTimeout(() => {
      if (!hasInstallPromptFired) {
        setIsInstalled(true);
        setShowBanner(true);
      }
    }, 500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setIsInstalled(true);
      localStorage.setItem("bouwnce_app_installed", "true");
    }

    setInstallPrompt(null);
  };

  const handleOpenApp = () => {
    window.location.href = "web+bouwnce://open";
  };

  const handleDismiss = () => {
    localStorage.setItem("bouwnce_prompt_dismissed", "true");
    setShowBanner(false);
  };

  if (isStandalone || !showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 z-1000 md:max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl bg-white p-4 shadow-2xl shadow-black/10 border border-lighter-ash">
        {/* Dismiss Icon */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss prompt"
          className="absolute top-1 right-2 rounded-lg p-1 text-ash hover:bg-lighter-ash hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>

        {/* Top / Left Content */}
        <div className="flex items-center gap-3 pr-6 sm:pr-0 flex-1 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lighter-ash/60">
            <Image
              src="/icon.png"
              alt="Bouwnce Logo"
              className="h-7 w-auto object-contain"
              width={28}
              height={28}
            />
          </div>

          <div className="flex-1 min-w-0 font-SFPro">
            <p className="text-sm font-semibold tracking-tight text-foreground truncate">
              {isInstalled ? "Bouwnce App Available" : "Get Bouwnce App"}
            </p>
            <p className="text-xs text-ash truncate">
              {isInstalled
                ? "Open app or stay on web"
                : "Faster access & push notifications"}
            </p>
          </div>
        </div>

        {/* Actions Layout */}
        <div className="w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
          {isInstalled && !installPrompt ? (
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
              <button
                type="button"
                onClick={handleOpenApp}
                className="w-full sm:w-auto rounded-xl bg-brand-orange px-4 py-2.5 sm:py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm text-center whitespace-nowrap"
              >
                Open App
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full sm:w-auto rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 sm:py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors text-center whitespace-nowrap"
              >
                Continue on Web
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
              <button
                type="button"
                onClick={handleInstall}
                className="w-full sm:w-auto rounded-xl bg-brand-orange px-5 py-2.5 sm:py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm text-center whitespace-nowrap"
              >
                Install
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full sm:w-auto rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 sm:py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors text-center whitespace-nowrap"
              >
                Continue on Web
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
