self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let data;

  try {
    data = event.data.json();
  } catch {
    data = {
      title: "Bouwnce",
      body: event.data.text(),
    };
  }

  const title = data.title || "Bouwnce";

  const options = {
    body: data.body || data.message || "",
    icon: data.icon || "/favicon.ico",
    badge: data.badge || "/favicon.ico",

    data: {
      url: data.url || "/",
      notificationId: data.notification_id || data.id,
    },

    tag: data.tag || "bouwnce-notification",

    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification?.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});
