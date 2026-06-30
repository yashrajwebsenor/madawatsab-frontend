import { useState } from "react";
import { addToast } from "@heroui/react";
import api from "../api/api";
import ENDPOINTS from "../api/endpoints";
import useUserStore from "../store/useUserStore";
import useProfile from "./useProfile";

/**
 * Pause / resume the current account's discovery & search visibility.
 *
 * `isPaused` is read from the user store (kept fresh by getMyProfile on app
 * load), so every consumer of this hook reflects the same state. Toggling hits
 * the backend then refetches the profile so the store — and therefore the
 * discover/search screens that key off `user.isPaused` — updates everywhere.
 */
const usePauseAccount = () => {
  const user = useUserStore((s) => s.user);
  const { getMyProfile } = useProfile();
  const [pending, setPending] = useState(false);

  const isPaused = !!user?.isPaused;

  const setPaused = async (next: boolean) => {
    if (pending) return;
    try {
      setPending(true);
      await api.put(ENDPOINTS.PROFILE.PAUSE, { isPaused: next });
      await getMyProfile();
      addToast({
        color: next ? "warning" : "success",
        title: next ? "Account paused" : "Account resumed",
        description: next
          ? "You're now hidden from discovery and search. Your connections can still message you."
          : "Your profile is visible in discovery and search again.",
      });
    } catch (error: any) {
      addToast({
        color: "danger",
        title: "Could not update visibility",
        description:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setPending(false);
    }
  };

  return { isPaused, pending, setPaused };
};

export default usePauseAccount;
