import api from "../api/api";
import ENDPOINTS from "../api/endpoints";
import routes from "../configs/route-paths";
import socketService from "../socket";
import useUserStore from "../store/useUserStore";
import { HelpSupportStatus } from "../types/enum";

class CommonUtils {
  static async logout() {
    try {
      await this.unSubscribeToTopic();
    } catch (error) {
      console.log("Failed to unsubscribe before logout:", error);
    }

    socketService.disconnect();
    localStorage.clear();
    useUserStore.getState().clearUser();
    window.location.replace(routes.auth.login);
  }

  static getStatusColor(status: string) {
    switch (status) {
      case HelpSupportStatus.pending:
        return "warning";
      case HelpSupportStatus.resolved:
        return "success";
      default:
        return "default";
    }
  }

  static formatTitle(key: string) {
    if (!key) return "";

    return key
      ?.toString()
      ?.replace(/([A-Z])/g, " $1")
      ?.replace(/[_-]+/g, " ")
      ?.trim()
      ?.split(/\s+/)
      ?.map(
        (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
      )
      ?.join(" ");
  }

  static async handleAdvertisementAction({
    ctaUrl,
    _id,
  }: {
    ctaUrl: string;
    _id: string;
  }) {
    if (ctaUrl && typeof window !== "undefined") {
      window.open(ctaUrl, "_blank");
    }
    await api.post(ENDPOINTS.ADVERTISEMENTS.CLICK(_id), {});
  }

  static maskEmail(email: string) {
    if (!email?.trim()) return "";
    const [name, domain] = email.split("@");
    if (name.length <= 3) return email;
    return `${name.slice(0, 3)}*****@${domain}`;
  }

  static maskPhone(phone: string) {
    if (!phone) return "";
    return `${phone.slice(0, 5)}*****`;
  }

  static async subscribeToTopic(fcmToken: string) {
    if (fcmToken) {
      await api.post(ENDPOINTS.NOTIFICATIONS.SUBSCRIBE, { fcmToken });
    }
    return;
  }

  static async unSubscribeToTopic() {
    if (typeof window !== "undefined") {
      const fcmToken = localStorage.getItem("fcmToken");
      if (fcmToken) {
        await api.post(ENDPOINTS.NOTIFICATIONS.UNSUBSCRIBE, { fcmToken });
      }
    }
    return;
  }

  static formatNameWithUserId({
    fullName,
    userId,
  }: {
    fullName: string;
    userId: string;
  }) {
    if (!userId) return fullName;
    return `${fullName} (${userId})`;
  }
}

export default CommonUtils;
