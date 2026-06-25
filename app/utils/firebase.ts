import { getApp, getApps, initializeApp } from "firebase/app";
import APP_CONFIG from "../configs/app-config";
import { getMessaging, getToken } from "firebase/messaging";

const app = !getApps().length ? initializeApp(APP_CONFIG.FIREBASE) : getApp();

export const messaging =
  typeof window !== "undefined" ? getMessaging(app) : null;

// Prompts for notification permission, then returns the FCM token (or null if
// denied/unsupported). Call only from a user gesture (login, "enable" button).
export const fetchToken = async () => {
  if (!messaging) return null;
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    return await getToken(messaging, {
      vapidKey: APP_CONFIG.FIREBASE.vapidKey,
    });
  }
  return null;
};

// Returns the current FCM token ONLY if permission is already granted — never
// prompts. Used for the silent post-login sync: getToken returns the rotated
// token when FCM has refreshed it, which is the web equivalent of the (removed)
// onTokenRefresh listener.
export const getTokenIfGranted = async () => {
  if (!messaging) return null;
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (Notification.permission !== "granted") return null;
  return await getToken(messaging, {
    vapidKey: APP_CONFIG.FIREBASE.vapidKey,
  });
};
