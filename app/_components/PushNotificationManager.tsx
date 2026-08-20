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

  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  const syncInProgressRef = useRef(false);

  const syncedEndpointRef = useRef<string | null>(null);
  const subscribePushRef = useRef(subscribePush.mutateAsync);

  useEffect(() => {
    subscribePushRef.current = subscribePush.mutateAsync;
  }, [subscribePush.mutateAsync]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!("Notification" in window)) {
      console.warn("[PUSH] Browser does not support notifications");
      return;
    }

    const currentPermission = Notification.permission;

    setNotificationPermission(currentPermission);

    console.log("[PUSH] Current notification permission:", currentPermission);

    /**
     * Only request when permission has never been decided.
     */
    if (currentPermission === "default") {
      Notification.requestPermission()
        .then((permission) => {
          console.log("[PUSH] Notification permission:", permission);

          setNotificationPermission(permission);
        })
        .catch((error) => {
          console.error(
            "[PUSH] Failed to request notification permission",
            error,
          );
        });
    }
  }, []);

  /**
   * Register the push service worker once.
   */
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      console.warn("[PUSH] Service workers are not supported");
      return;
    }

    let cancelled = false;

    navigator.serviceWorker
      .register("/push-sw.js")
      .then((registered) => {
        if (cancelled) {
          return;
        }

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
   * Create/reuse the browser PushSubscription and sync it
   * with the backend.
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

    if (notificationPermission !== "granted") {
      console.log(
        "[PUSH] Notification permission is not granted:",
        notificationPermission,
      );
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

      /**
       * Reuse the existing subscription whenever possible.
       */
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
       * Already synchronized during this component lifetime.
       */
      if (syncedEndpointRef.current === endpoint) {
        console.log("[PUSH] Subscription already synced");

        return;
      }

      /**
       * Already synchronized previously in this browser.
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
       * Only save this after backend synchronization succeeds.
       */
      syncedEndpointRef.current = endpoint;

      window.localStorage.setItem(PUSH_SYNCED_ENDPOINT_KEY, endpoint);

      console.log("[PUSH] Subscription saved successfully");
    } catch (error) {
      console.error("[PUSH] Failed to enable push notifications", error);
    } finally {
      syncInProgressRef.current = false;
    }
  }, [registration, notificationPermission, vapidData?.public_key]);

  /**
   * Automatically synchronize the subscription after:
   *
   * - permission becomes granted
   * - service worker is registered
   * - VAPID key becomes available
   */
  useEffect(() => {
    if (!registration) {
      return;
    }

    if (notificationPermission !== "granted") {
      return;
    }

    if (!vapidData?.public_key) {
      return;
    }

    void enablePush();
  }, [registration, notificationPermission, vapidData?.public_key, enablePush]);

  /**
   * Disable push notifications.
   */
  const disablePush = useCallback(async () => {
    if (!registration) {
      return;
    }

    try {
      const subscription = await registration.pushManager.getSubscription();

      /**
       * Remove subscription from backend first.
       */
      await unsubscribePush.mutateAsync();

      /**
       * Then remove it from the browser.
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
   * Expose controls to the rest of the application.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("push:ready", {
        detail: {
          enablePush,
          disablePush,
          permission: notificationPermission,
        },
      }),
    );
  }, [enablePush, disablePush, notificationPermission]);

  return null;
}
