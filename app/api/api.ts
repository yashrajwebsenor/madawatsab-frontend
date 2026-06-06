import { addToast } from "@heroui/react";
import axios from "axios";
import CommonUtils from "../utils/common.utils";
import APP_CONFIG from "../configs/app-config";

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

    addToast({
      title: "Error",
      color: "danger",
      description: error?.response?.data?.message || "Something went wrong",
    });

    return Promise.reject(error?.response?.data);
  },
);

export default api;
