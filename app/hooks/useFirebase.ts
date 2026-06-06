import CommonUtils from "../utils/common.utils";
import { fetchToken } from "../utils/firebase";

const useFirebase = () => {
  const initFirebase = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const currentToken = await fetchToken();
        if (currentToken) {
          await CommonUtils.subscribeToTopic(currentToken);
          localStorage.setItem("fcmToken", currentToken);
          return currentToken;
        }
      } catch (error) {
        console.log("An error occurred while retrieving token:", error);
      }
    }
  };

  return { initFirebase };
};

export default useFirebase;
