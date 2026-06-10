"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import useUserStore from "../store/useUserStore";
import useConfigStore from "../store/useConfigStore";
import routes from "../configs/route-paths";
import MainHeader from "../components/layouts/MainHeader";
import useFirebase from "../hooks/useFirebase";
import useChatRooms from "../hooks/useChatRooms";
import NotificationBar from "../components/notifications/NotificationBar";
import ChatSocketListener from "../components/chat/ChatSocketListener";
import socketService from "../socket";

const layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUserStore();
  const { config } = useConfigStore();
  const { initFirebase } = useFirebase();

  // Admin toggles. A missing/unloaded config defaults to enabled (gate on).
  const entryFeeEnabled = config?.entryFeeEnabled !== "false";
  const spinWheelEnabled = config?.spinWheelEnabled !== "false";

  // Load chat rooms app-wide so the navbar unread badge is accurate on every
  // page (the store keeps the counts live via socket events).
  useChatRooms();

  useEffect(() => {
    if (!user?.isOnboardingCompleted) {
      router.push(routes.onboarding.step1);
      return;
    }

    // Entry gate: only when the fee is enabled AND the user hasn't been granted
    // access (paid or waived). Users who already have access are never sent back.
    if (entryFeeEnabled && !user?.hasAppAccess && pathname !== routes.entryFee) {
      router.push(routes.entryFee);
      return;
    }

    // Spin gate: shown after entry, only when enabled AND not yet resolved.
    if (
      spinWheelEnabled &&
      user?.hasAppAccess &&
      !user?.spinResolved &&
      pathname !== routes.spinReward
    ) {
      router.push(routes.spinReward);
      return;
    }

    if (typeof window !== "undefined") {
      const fcmToken = localStorage.getItem("fcmToken");
      if (user?._id && !fcmToken) {
        initFirebase();
      }
    }

    if (user?._id) {
      socketService.connect(user._id);
    }
  }, [user, router, pathname]);

  return (
    <div className="min-h-screen w-full flex flex-col">
      {pathname !== routes.entryFee && pathname !== routes.spinReward && (
        <MainHeader />
      )}
      <main className="flex-1 grid grid-cols-1">{children}</main>
      <ChatSocketListener />
      <NotificationBar />
    </div>
  );
};

export default layout;
