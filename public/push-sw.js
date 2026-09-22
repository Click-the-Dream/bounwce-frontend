self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("[PUSH SW] Push event received");
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Bouwnce", body: event.data.text() };
  }

  const isChatNotification =
    data.event_type === "chat_message" ||
    data.type === "chat_message" ||
    data.category === "chat";

  const targetUrl = data.url || (isChatNotification ? "/app/chat" : "/");
  const notificationId = data.notification_id || data.id || null;

  const notificationTag =
    data.tag ||
    (notificationId ? `bouwnce-notification:${notificationId}` : undefined);

  const options = {
    body: data.body || data.message || "New notification",
    icon: data.icon || "/icons/icon-192.png",
    badge: data?.profile_image?.url || data.badge || "/icons/icon-192.png",
    data: {
      url: targetUrl,
      notificationId,
    },
    ...(notificationTag ? { tag: notificationTag } : {}),
    renotify: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Bouwnce", options),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawUrl = event.notification?.data?.url || "/";
  const normalizedPath =
    rawUrl === "/chat" || rawUrl.startsWith("/chat?")
      ? "/app/chat" +
        (rawUrl.includes("?") ? rawUrl.slice(rawUrl.indexOf("?")) : "")
      : rawUrl;
  const url = new URL(normalizedPath, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (
            "focus" in client &&
            client.url.startsWith(self.location.origin)
          ) {
            return client.focus().then(() => client.navigate(url));
          }
        }

        return self.clients.openWindow(url);
      }),
  );
});
