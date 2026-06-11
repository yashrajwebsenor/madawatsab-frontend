"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useUserStore from "../store/useUserStore";
import useConfigStore from "../store/useConfigStore";
import routes from "../configs/route-paths";
import resolveGateRoute from "../utils/gate.utils";
import MainHeader from "../components/layouts/MainHeader";
import useFirebase from "../hooks/useFirebase";
import useChatRooms from "../hooks/useChatRooms";
import NotificationBar from "../components/notifications/NotificationBar";
import ChatSocketListener from "../components/chat/ChatSocketListener";
import socketService from "../socket";

const layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user } = useUserStore();
  const { config } = useConfigStore();
  const { initFirebase } = useFirebase();

  // Entry-fee / spin-wheel gates. The gate pages themselves live in the
  // (gate) group (bare shell), so when a gate is pending this layout's only
  // job is to redirect — it must NOT mount the app services below: their APIs
  // sit behind AppAccessGuard and would 403 with error toasts.
  const nextGate = resolveGateRoute(user, config);
  const isGateBlocked = !user?.isOnboardingCompleted || nextGate !== routes.home;

  // Load chat rooms app-wide so the navbar unread badge is accurate on every
  // page (the store keeps the counts live via socket events).
  useChatRooms({ enabled: !isGateBlocked });

  useEffect(() => {
    if (!user?.isOnboardingCompleted) {
      router.push(routes.onboarding.step1);
      return;
    }

    if (nextGate !== routes.home) {
      router.push(nextGate);
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
  }, [user, router, nextGate]);

  // While redirecting to onboarding or a gate page, render nothing so app
  // pages (discover, chat, ...) never fire their guarded API calls.
  if (isGateBlocked) return null;

  return (
    <div className="min-h-screen w-full flex flex-col">
      <MainHeader />
      <main className="flex-1 grid grid-cols-1">{children}</main>
      <ChatSocketListener />
      <NotificationBar />
    </div>
  );
};

export default layout;
