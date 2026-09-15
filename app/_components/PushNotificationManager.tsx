"use client";

import { Bell, ExternalLink, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import useNotificationServices from "@/app/hooks/use-notification";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < rawData.length; i += 1) {
    bytes[i] = rawData.charCodeAt(i);
  }

  return buffer;
}

const PUSH_SYNCED_ENDPOINT_KEY = "bouwnce:push:synced-endpoint";

function detectIOS() {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function detectStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function PushNotificationManager() {
  const { vapidPublicKey, subscribePush, unsubscribePush } =
    useNotificationServices();
  const { data: vapidData } = vapidPublicKey();

  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [promptVisible, setPromptVisible] = useState(false);
  const [promptBusy, setPromptBusy] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  const syncInProgressRef = useRef(false);
  const syncedEndpointRef = useRef<string | null>(null);
  const subscribePushRef = useRef(subscribePush.mutateAsync);

  useEffect(() => {
    subscribePushRef.current = subscribePush.mutateAsync;
  }, [subscribePush.mutateAsync]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ios = detectIOS();
    const standalone = detectStandalone();

    setIsIOS(ios);
    setIsStandalone(standalone);

    if (!("Notification" in window)) return;

    const permission = Notification.permission;
    setNotificationPermission(permission);
    setPromptVisible(permission !== "granted");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      console.warn("[PUSH] Service workers are not supported");
      return;
    }

    let cancelled = false;

    navigator.serviceWorker
      .register("/push-sw.js")
      .then((registered) => {
        if (cancelled) return;
        setRegistration(registered);
      })
      .catch((error) => {
        console.error("[PUSH] Service worker registration failed", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const enablePush = useCallback(async () => {
    if (syncInProgressRef.current || !registration) return;

    if (!("PushManager" in window)) {
      throw new Error("Push notifications are not supported by this browser.");
    }

    if (notificationPermission !== "granted") {
      throw new Error("Notification permission has not been granted.");
    }

    const publicKey = vapidData?.public_key;
    if (!publicKey) {
      throw new Error("Push notifications are still being prepared. Try again in a moment.");
    }

    syncInProgressRef.current = true;

    try {
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const endpoint = subscription.endpoint;
      const previouslySynced = window.localStorage.getItem(
        PUSH_SYNCED_ENDPOINT_KEY,
      );

      if (
        syncedEndpointRef.current === endpoint ||
        previouslySynced === endpoint
      ) {
        syncedEndpointRef.current = endpoint;
        return;
      }

      await subscribePushRef.current(subscription.toJSON());
      syncedEndpointRef.current = endpoint;
      window.localStorage.setItem(PUSH_SYNCED_ENDPOINT_KEY, endpoint);
    } finally {
      syncInProgressRef.current = false;
    }
  }, [registration, notificationPermission, vapidData?.public_key]);

  const requestAndEnablePush = useCallback(async () => {
    if (promptBusy) return;

    setPromptBusy(true);
    setPromptError(null);

    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        throw new Error("This browser does not support notifications.");
      }

      if (isIOS && !isStandalone) {
        throw new Error(
          "On iPhone, first add Bouwnce to your Home Screen and open it from the Home Screen. Then tap Allow notifications.",
        );
      }

      let permission = Notification.permission;

      // This call happens directly from the button click, which is required by iOS.
      if (permission === "default") {
        permission = await Notification.requestPermission();
        setNotificationPermission(permission);
      }

      if (permission !== "granted") {
        setPromptVisible(true);
        setPromptError(
          permission === "denied"
            ? "Notifications are blocked. Allow Bouwnce in your browser/device notification settings and try again."
            : "Notification permission was not granted.",
        );
        return;
      }

      if (!registration || !vapidData?.public_key) {
        setPromptError("Notifications are preparing. Tap Allow notifications again in a moment.");
        return;
      }

      await enablePush();
      setPromptVisible(false);
    } catch (error: any) {
      console.error("[PUSH] Failed to enable notifications", error);
      setPromptVisible(true);
      setPromptError(error?.message || "We couldn't enable notifications yet.");
    } finally {
      setPromptBusy(false);
    }
  }, [enablePush, isIOS, isStandalone, promptBusy, registration, vapidData?.public_key]);

  // If permission was already granted, silently sync an existing subscription.
  useEffect(() => {
    if (
      notificationPermission !== "granted" ||
      !registration ||
      !vapidData?.public_key
    ) {
      return;
    }

    void enablePush().catch((error) => {
      console.error("[PUSH] Existing subscription sync failed", error);
    });
  }, [enablePush, notificationPermission, registration, vapidData?.public_key]);

  const disablePush = useCallback(async () => {
    if (!registration) return;

    try {
      const subscription = await registration.pushManager.getSubscription();
      await unsubscribePush.mutateAsync();

      if (subscription) {
        await subscription.unsubscribe();
      }

      syncedEndpointRef.current = null;
      window.localStorage.removeItem(PUSH_SYNCED_ENDPOINT_KEY);
    } catch (error) {
      console.error("[PUSH] Failed to disable push notifications", error);
    }
  }, [registration, unsubscribePush]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent("push:ready", {
        detail: {
          enablePush,
          disablePush,
          permission: notificationPermission,
        },
      }),
    );
  }, [disablePush, enablePush, notificationPermission]);

  if (!promptVisible || notificationPermission === "granted") {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-[100000] mx-auto max-w-md rounded-2xl border border-black/10 bg-white p-4 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange/10 text-orange">
          <Bell className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#171413]">Enable notifications</p>
              <p className="mt-0.5 text-xs leading-5 text-[#756d68]">
                Get alerts for new messages and important account activity.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPromptVisible(false)}
              className="rounded-full p-1 text-[#aaa09a] hover:bg-black/5"
              aria-label="Dismiss notification prompt"
            >
              <X className="size-4" />
            </button>
          </div>

          {isIOS && !isStandalone ? (
            <div className="mt-3 rounded-xl bg-[#faf7f5] p-3 text-[11px] leading-5 text-[#5e5651]">
              <strong>iPhone setup:</strong> open Bouwnce in Safari, tap Share,
              choose <strong>Add to Home Screen</strong>, keep
              <strong> Open as Web App</strong> enabled, then launch Bouwnce from
              the Home Screen and tap Allow notifications.
              <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-orange">
                <ExternalLink className="size-3" />
                Home Screen app required on iPhone
              </div>
            </div>
          ) : null}

          {promptError ? (
            <p className="mt-2 text-[11px] font-medium leading-5 text-red-600">
              {promptError}
            </p>
          ) : null}

          <button
            type="button"
            onClick={requestAndEnablePush}
            disabled={promptBusy || (isIOS && !isStandalone)}
            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#171413] px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            {promptBusy
              ? "Enabling…"
              : isIOS && !isStandalone
                ? "Install Bouwnce first"
                : "Allow notifications"}
          </button>
        </div>
      </div>
    </div>
  );
}
