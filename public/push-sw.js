self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

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

  const nestedPayload =
    notificationData.payload && typeof notificationData.payload === "object"
      ? notificationData.payload
      : payload?.payload && typeof payload.payload === "object"
        ? payload.payload
        : {};
  const normalizedType = String(
    notificationType || nestedPayload.event_type || nestedPayload.type || "",
  ).toLowerCase();
  const isGroupNotification =
    [
      "group_message",
      "group_chat_message",
      "group_mention",
      "group_invite",
      "group_chat_invite",
      "group_message_mention",
    ].includes(normalizedType) ||
    String(notificationData.category || payload.category || nestedPayload.category || "").toLowerCase() === "group_chat" ||
    Boolean(
      notificationData.group_id || notificationData.groupId || payload.group_id ||
      payload.groupId || nestedPayload.group_id || nestedPayload.groupId
    );

  const isChatNotification =
    notificationData.type === "chat_message" ||
    payload.event_type === "chat_message" ||
    payload.type === "chat_message" ||
    payload.category === "chat" ||
    isGroupNotification;

  const groupId =
    notificationData.group_id ||
    notificationData.groupId ||
    payload.group_id ||
    payload.groupId ||
    notificationData.group?.id ||
    payload.group?.id ||
    nestedPayload.group_id ||
    nestedPayload.groupId ||
    nestedPayload.group?.id ||
    null;

  const groupName = String(
    notificationData.group_name ||
      notificationData.groupName ||
      notificationData.group?.name ||
      payload.group_name ||
      payload.groupName ||
      payload.group?.name ||
      nestedPayload.group_name ||
      nestedPayload.groupName ||
      nestedPayload.group?.name ||
      "Group chat",
  );

  const isMention = Boolean(
    notificationData.mentioned ||
      notificationData.is_mention ||
      payload.mentioned ||
      payload.is_mention ||
      nestedPayload.mentioned ||
      nestedPayload.is_mention ||
      normalizedType === "group_mention" ||
      normalizedType === "group_message_mention",
  );

  const senderProfileImage =
    typeof notificationData.sender_profile_image === "string"
      ? notificationData.sender_profile_image
      : notificationData.sender_profile_image?.url ||
        notificationData.sender?.profile_pic?.url ||
        payload.sender?.profile_pic?.url ||
        nestedPayload.sender_profile_image?.url ||
        nestedPayload.sender?.profile_pic?.url ||
        null;

  const senderIcon = senderProfileImage || notificationData.icon || null;
  const appIcon = "/icons/icon-192.png";

  let targetUrl =
    isGroupNotification && groupId
      ? `/app/chat?groupId=${encodeURIComponent(String(groupId))}`
      : notificationData.url || payload.url || (isChatNotification ? "/app/chat" : "/");

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
    body: isGroupNotification
      ? `${isMention ? "You were mentioned · " : ""}${
          payload.body ||
          notificationData.body ||
          payload.message ||
          notificationData.message ||
          nestedPayload.body ||
          nestedPayload.message ||
          "New group message"
        }`
      : payload.body ||
        notificationData.body ||
        payload.message ||
        notificationData.message ||
        "New notification",

    // Chat notifications use the sender's avatar as the primary notification
    // icon (the familiar messaging-app pattern). Other notifications retain
    // the app/notification icon.
    icon: senderIcon ?? appIcon,

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
      isGroupNotification
        ? isMention
          ? `Mentioned in ${groupName}`
          : `Group · ${groupName}`
        : payload.title || notificationData.title || "Bouwnce",
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
