import { addToast } from "@heroui/react";
import axios from "axios";
import CommonUtils from "../utils/common.utils";
import APP_CONFIG from "../configs/app-config";
import useUpgradeModalStore from "../store/useUpgradeModalStore";

// Backend error `code`s that should open the upgrade modal instead of a toast.
const UPGRADE_MODAL_CODES = [
  "INTEREST_LIMIT_REACHED",
  "VVIP_INTEREST_RESTRICTED",
];

const api = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    return response?.data;
  },
  (error) => {
    if (typeof window !== "undefined") {
      const isAuthPage = window.location.pathname.includes("/auth");
      const isUnauthorized =
        error?.response?.status === 401 || error?.response?.statusCode === 401;

      if (!isAuthPage && isUnauthorized) {
        CommonUtils.logout();
      }
    }

    // Plan-gating errors open the upgrade modal (with a "View plans" CTA)
    // instead of a transient toast.
    const code = error?.response?.data?.code;
    if (code && UPGRADE_MODAL_CODES.includes(code)) {
      useUpgradeModalStore.getState().open(error?.response?.data?.message);
      return Promise.reject(error?.response?.data);
    }

    addToast({
      title: "Error",
      color: "danger",
      description: error?.response?.data?.message || "Something went wrong",
    });

    return Promise.reject(error?.response?.data);
  },
);

export default api;
