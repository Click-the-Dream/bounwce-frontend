self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function getSenderProfileImage(payload, notificationData) {
  const profileImage =
    notificationData?.sender_profile_image ?? payload?.sender_profile_image;

  const url =
    typeof profileImage === "string"
      ? profileImage
      : profileImage && typeof profileImage === "object"
        ? profileImage.url
        : null;

  return url;
}

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "Bouwnce",
      body: event.data.text(),
      data: {},
    };
  }

  const notificationData =
    payload?.data && typeof payload.data === "object" ? payload.data : {};

  const notificationType =
    notificationData.type || payload.event_type || payload.type || null;
  const isChatNotification =
    notificationType === "chat_message" || payload.category === "chat";

  const senderProfileImage = getSenderProfileImage(payload, notificationData);
  const appIcon =
    normalizeImageUrl(notificationData.app_icon) || "/icons/icon-192.png";
  const suppliedIcon = normalizeImageUrl(notificationData.icon);

  let targetUrl =
    notificationData.url ||
    payload.url ||
    (isChatNotification ? "/app/chat" : "/");

  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = targetUrl.startsWith("/") ? targetUrl : `/${targetUrl}`;
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

    // Chat notifications use the sender's avatar as the primary notification
    // icon (the familiar messaging-app pattern). Other notifications retain
    // the app/notification icon.
    icon:
      isChatNotification && senderProfileImage
        ? senderProfileImage
        : suppliedIcon || appIcon,

    // Keep Bouwnce branding in the compact monochrome status-bar slot.
    badge: appIcon,

    // Supported desktop/browser surfaces can show a larger sender-photo preview.
    ...(isChatNotification && senderProfileImage
      ? { image: senderProfileImage }
      : {}),

    data: {
      url: targetUrl,
      notificationId,
      type: notificationType,
    },

    ...(notificationTag ? { tag: notificationTag } : {}),
    renotify: false,
  };

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

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (
            "focus" in client &&
            client.url.startsWith(self.location.origin)
          ) {
            return client.focus().then(() => {
              if ("navigate" in client) return client.navigate(url);
            });
          }
        }

        return self.clients.openWindow(url);
      }),
  );
});
