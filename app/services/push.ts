import api from "./api";

export async function disablePushForCurrentDevice() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.getSubscription();

    try {
      await api.delete("/push/subscribe");
    } catch (error) {
      console.warn(
        "[PUSH] failed to remove server push subscriptions during logout:",
        error,
      );
    }

    /**
     * Remove the current browser subscription.
     */
    if (subscription) {
      try {
        await subscription.unsubscribe();
      } catch (error) {
        console.warn("[PUSH] browser unsubscribe failed during logout:", error);
      }
    }
  } catch (error) {
    console.warn("[PUSH] unable to clean up device subscription:", error);
  }
}
