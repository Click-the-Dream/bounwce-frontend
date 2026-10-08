self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("[PUSH SW] Push event received");

  if (!event.data) {
    console.log("[PUSH SW] No event data");
    return;
  }

  let payload;

  try {
    payload = event.data.json();
    console.log("[PUSH SW] Raw push payload:", payload);
  } catch (error) {
    console.error("[PUSH SW] Failed to parse JSON:", error);

    payload = {
      title: "Bouwnce",
      body: event.data.text(),
      data: {},
    };
  }

  /*Backend structure is:
   * {
   *   title,
   *   body,
   *   data: {
   *     type,
   *     url,
   *     icon,
   *     tag,
   *     sender_profile_image: {
   *       url
   *     }
   *   }
   * }*/

  const notificationData =
    payload?.data && typeof payload.data === "object" ? payload.data : {};

  console.log("[PUSH SW] Notification data:", notificationData);

  const isChatNotification =
    notificationData.type === "chat_message" ||
    payload.event_type === "chat_message" ||
    payload.type === "chat_message" ||
    payload.category === "chat";

  const senderProfileImage =
    typeof notificationData.sender_profile_image === "string"
      ? notificationData.sender_profile_image
      : notificationData.sender_profile_image?.url || null;

  const senderIcon = senderProfileImage || notificationData.icon || null;

  let targetUrl =
    notificationData.url ||
    payload.url ||
    (isChatNotification ? "/app/chat" : "/");

  if (!targetUrl.startsWith("/")) {
    targetUrl = `/${targetUrl}`;
  }

  const notificationId =
    payload.notification_id ||
    notificationData.notification_id ||
    payload.id ||
    notificationData.id ||
    null;

  const notificationTag =
    notificationData.tag ||
    payload.tag ||
    (notificationId ? `bouwnce-notification:${notificationId}` : undefined);
  const options = {
    body:
      payload.body ||
      notificationData.body ||
      payload.message ||
      notificationData.message ||
      "New notification",

    icon: senderIcon || "/icons/icon-192.png",

    badge: "/icons/icon-192.png",

    data: {
      url: targetUrl,
      notificationId,
      type: notificationData.type || payload.type || null,
    },

    ...(notificationTag
      ? {
          tag: notificationTag,
        }
      : {}),

    renotify: false,
  };

  console.log("[PUSH SW] Final notification options:", options);

  event.waitUntil(
    self.registration.showNotification(
      payload.title || notificationData.title || "Bouwnce",
      options,
    ),
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

  console.log("[PUSH SW] Notification clicked:", url);

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if (
            "focus" in client &&
            client.url.startsWith(self.location.origin)
          ) {
            return client.focus().then(() => {
              if ("navigate" in client) {
                return client.navigate(url);
              }
            });
          }
        }

        return self.clients.openWindow(url);
      }),
  );
});
