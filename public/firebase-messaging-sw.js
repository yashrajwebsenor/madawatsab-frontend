importScripts(
  "https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyBohDMv0Dh6ExQPSqOk3JL1FfkiyQEiBcs",
  authDomain: "madawatsab-8640d.firebaseapp.com",
  projectId: "madawatsab-8640d",
  storageBucket: "madawatsab-8640d.firebasestorage.app",
  messagingSenderId: "821286014901",
  appId: "1:821286014901:web:1445aa752e15d88b6213fc",
});

const messaging = firebase.messaging();

// Notifications are sent data-only (no `notification` payload) so the browser
// never auto-displays them. When the app is backgrounded/closed we render the
// OS notification ourselves, stashing the deep-link route in its data so the
// click handler below can open it.
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || "New notification";

  self.registration.showNotification(title, {
    body: data.body || "",
    icon: "/assets/images/logo.png",
    badge: "/assets/images/logo.png",
    // Same tag => a new push from the same source (e.g. a busy chat thread)
    // replaces the previous tray entry instead of stacking; renotify still
    // alerts the user to the new one.
    tag: data.collapseKey || undefined,
    renotify: Boolean(data.collapseKey),
    data: { route: data.route || "/" },
  });
});

// Tapping the OS notification: focus an existing app tab (navigating it to the
// route) or open a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const route = (event.notification.data && event.notification.data.route) || "/";
  const targetUrl = new URL(route, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client) client.navigate(targetUrl);
            return;
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      }),
  );
});
