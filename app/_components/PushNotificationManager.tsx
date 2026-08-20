"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useNotificationServices from "@/app/hooks/use-notification";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < rawData.length; i++) {
    bytes[i] = rawData.charCodeAt(i);
  }

  return buffer;
}

const PUSH_SYNCED_ENDPOINT_KEY = "bouwnce:push:synced-endpoint";

export default function PushNotificationManager() {
  const { vapidPublicKey, subscribePush, unsubscribePush } =
    useNotificationServices();

  const { data: vapidData } = vapidPublicKey();

  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  /**
   * Prevent multiple simultaneous subscribe requests.
   */
  const syncInProgressRef = useRef(false);

  /**
   * Remember the endpoint already synced during this component lifetime.
   */
  const syncedEndpointRef = useRef<string | null>(null);

  /**
   * Keep the latest mutation function without making enablePush depend
   * on the mutation object itself.
   */
  const subscribePushRef = useRef(subscribePush.mutateAsync);

  useEffect(() => {
    subscribePushRef.current = subscribePush.mutateAsync;
  }, [subscribePush.mutateAsync]);

  /**
   * Register service worker once.
   */
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;

    navigator.serviceWorker
      .register("/push-sw.js")
      .then((registered) => {
        if (cancelled) return;

        console.log("[PUSH] Service worker registered");

        setRegistration(registered);
      })
      .catch((error) => {
        console.error("[PUSH] Service worker registration failed", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Enable/sync push subscription.
   *
   * This function deliberately does NOT depend on the React Query
   * mutation object.
   */
  const enablePush = useCallback(async () => {
    if (syncInProgressRef.current) {
      console.log("[PUSH] Subscription sync already in progress");
      return;
    }

    if (!registration) {
      console.warn("[PUSH] Service worker is not ready");
      return;
    }

    if (!("PushManager" in window)) {
      console.warn("[PUSH] Push notifications are not supported");
      return;
    }

    if (
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    const publicKey = vapidData?.public_key;

    if (!publicKey) {
      console.warn("[PUSH] VAPID public key is not ready");
      return;
    }

    syncInProgressRef.current = true;

    try {
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log("[PUSH] Creating browser push subscription");

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const endpoint = subscription.endpoint;

      console.log("[PUSH] Browser subscription:", endpoint);

      /**
       * If this exact endpoint was already synced in this page session,
       * don't POST it again.
       */
      if (syncedEndpointRef.current === endpoint) {
        console.log("[PUSH] Subscription already synced");
        return;
      }

      /**
       * Also check localStorage so a rerender/remount doesn't immediately
       * resubmit the same subscription.
       */
      const previouslySynced = window.localStorage.getItem(
        PUSH_SYNCED_ENDPOINT_KEY,
      );

      if (previouslySynced === endpoint) {
        syncedEndpointRef.current = endpoint;

        console.log("[PUSH] Subscription already synced with backend");

        return;
      }

      console.log("[PUSH] Syncing subscription with backend...");

      await subscribePushRef.current(subscription.toJSON());

      /**
       * Only mark it synced AFTER the backend succeeds.
       */
      syncedEndpointRef.current = endpoint;

      window.localStorage.setItem(PUSH_SYNCED_ENDPOINT_KEY, endpoint);

      console.log("[PUSH] Subscription saved successfully");
    } catch (error) {
      console.error("[PUSH] Failed to enable push notifications", error);
    } finally {
      syncInProgressRef.current = false;
    }
  }, [registration, vapidData?.public_key]);

  /**
   * Disable push.
   */
  const disablePush = useCallback(async () => {
    if (!registration) {
      return;
    }

    try {
      const subscription = await registration.pushManager.getSubscription();

      /**
       * Tell backend first.
       */
      await unsubscribePush.mutateAsync();

      /**
       * Remove browser subscription.
       */
      if (subscription) {
        await subscription.unsubscribe();
      }

      syncedEndpointRef.current = null;

      window.localStorage.removeItem(PUSH_SYNCED_ENDPOINT_KEY);

      console.log("[PUSH] Push notifications disabled");
    } catch (error) {
      console.error("[PUSH] Failed to disable push notifications", error);
    }
  }, [registration, unsubscribePush]);

  /**
   * Auto-sync only when:
   *
   * 1. service worker exists
   * 2. permission is already granted
   * 3. VAPID key is available
   * 4. registration changes
   *
   * Crucially, this does NOT depend on enablePush.
   */
  useEffect(() => {
    if (!registration) {
      return;
    }

    if (
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    if (!vapidData?.public_key) {
      return;
    }

    void enablePush();
  }, [registration, vapidData?.public_key]);

  /**
   * Expose controls globally for now.
   */
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("push:ready", {
        detail: {
          enablePush,
          disablePush,
        },
      }),
    );
  }, [enablePush, disablePush]);

  return null;
}
