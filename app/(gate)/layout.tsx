"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useUserStore from "../store/useUserStore";
import routes from "../configs/route-paths";

// Bare shell for the paywall pages (/entry-fee, /spin-reward). Deliberately
// NOT part of the (app) group: that layout mounts chat/socket/notification
// services whose APIs sit behind AppAccessGuard and would 403 (with error
// toasts) for users who haven't passed the entry gate yet.
const layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user } = useUserStore();

  useEffect(() => {
    // The gate pages only make sense after onboarding is done.
    if (user && !user.isOnboardingCompleted) {
      // replace: corrective bounce, not a user nav — must not grow history.
      router.replace(routes.onboarding.step1);
    }
  }, [user, router]);

  return <>{children}</>;
};

export default layout;
