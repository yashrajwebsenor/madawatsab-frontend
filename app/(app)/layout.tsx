"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import useUserStore from "../store/useUserStore";
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
  const { initFirebase } = useFirebase();

  // Load chat rooms app-wide so the navbar unread badge is accurate on every
  // page (the store keeps the counts live via socket events).
  useChatRooms();

  useEffect(() => {
    if (!user?.isOnboardingCompleted) {
      router.push(routes.onboarding.step1);
      return;
    }

    if (!user?.isEntryFeePaid && pathname !== routes.entryFee) {
      router.push(routes.entryFee);
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
