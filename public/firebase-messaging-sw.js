importScripts(
  "https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyBol2t4I_34qxeF2XlCxVmL-9n1-KumsqM",
  authDomain: "madawatsab-1a60f.firebaseapp.com",
  projectId: "madawatsab-1a60f",
  storageBucket: "madawatsab-1a60f.firebasestorage.app",
  messagingSenderId: "829547727743",
  appId: "1:829547727743:web:c55fceae2b87a2d9c3a84a",
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
