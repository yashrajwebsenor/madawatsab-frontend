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

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload,
  );
});
