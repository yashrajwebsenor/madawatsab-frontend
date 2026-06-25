import CommonUtils from "../utils/common.utils";
import { getTokenIfGranted } from "../utils/firebase";

const useFirebase = () => {
  // Silent, post-auth token sync. Runs on every authed app load:
  //  - registers the token if it's new or rotated (compared against the last
  //    one we know the backend has, cached in localStorage `fcmToken`);
  //  - is a no-op when permission isn't granted, so it doubles as the catch-up
  //    path for a user who enables notifications later.
  // This is the web equivalent of onTokenRefresh (the modular SDK has no such
  // listener — re-fetching getToken on load surfaces a rotated token).
  const syncToken = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const currentToken = await getTokenIfGranted();
      if (!currentToken) return;

      if (localStorage.getItem("fcmToken") !== currentToken) {
        await CommonUtils.registerFcmToken(currentToken);
        localStorage.setItem("fcmToken", currentToken);
      }
    } catch (error) {
      console.log("An error occurred while syncing the fcm token:", error);
    }
  };

  return { syncToken };
};

export default useFirebase;
