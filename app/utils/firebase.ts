import { getApp, getApps, initializeApp } from "firebase/app";
import APP_CONFIG from "../configs/app-config";
import { getMessaging, getToken } from "firebase/messaging";

const app = !getApps().length ? initializeApp(APP_CONFIG.FIREBASE) : getApp();

export const messaging =
  typeof window !== "undefined" ? getMessaging(app) : null;

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
