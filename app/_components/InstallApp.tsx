"use client";

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
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      console.log("[PWA] User installed Bouwnce");
    }

    setInstallPrompt(null);
    setShowInstall(false);
  };

  const handleDismiss = () => {
    setShowInstall(false);
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 z-1000 md:max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3.5 rounded-2xl bg-white p-3.5 pl-4 shadow-2xl shadow-black/10 border border-lighter-ash">
        {/* App Logo / Container */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lighter-ash/60">
          <Image
            src="/icon.png"
            alt="Bouwnce Logo"
            className="h-6 w-auto object-contain"
            width={24}
            height={24}
          />
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0 font-SFPro">
          <p className="text-sm font-semibold tracking-tight text-foreground">
            Get Bouwnce App
          </p>
          <p className="text-xs text-ash truncate">
            Faster access & push notifications
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={installApp}
            className="rounded-xl bg-brand-orange px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm"
          >
            Install
          </button>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss prompt"
            className="rounded-lg p-1 text-ash hover:bg-lighter-ash hover:text-foreground transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
