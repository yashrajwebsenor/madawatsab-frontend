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
import IdProofPromptModal from "../components/verify-identity/IdProofPromptModal";
import socketService from "../socket";

const layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user } = useUserStore();
  const { config } = useConfigStore();
  const { syncToken } = useFirebase();

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
      // replace, not push: this is a corrective bounce, not a user-initiated
      // nav — pushing would grow history and make back-button presses
      // ping-pong between this redirect and wherever it bounces from.
      router.replace(routes.onboarding.step1);
      return;
    }

    if (nextGate !== routes.home) {
      router.replace(nextGate);
      return;
    }

    if (user?._id) {
      // Silent: registers only if permission is granted and the token is new
      // or rotated. Covers the case where the token wasn't captured at login
      // (permission granted late, or fetch was slow) plus token rotation.
      syncToken();
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
      <IdProofPromptModal />
    </div>
  );
};

export default layout;
