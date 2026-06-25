"use client";

import { messaging } from "@/app/utils/firebase";
import { onMessage } from "firebase/messaging";
import { useEffect } from "react";
import { toast } from "sonner";
import { IoMdNotifications } from "react-icons/io";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

// In-app toast for foreground pushes. Notifications are sent data-only, so FCM
// delivers them HERE (onMessage) when the tab is focused — no system push is
// shown. When the tab is backgrounded/closed the service worker shows the OS
// notification instead. Tapping either navigates to the notification's route.
const NotificationBar = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined" || !messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      const data = (payload.data || {}) as Record<string, string>;
      const title = data.title || "New notification";
      const body = data.body || "";
      const route = data.route || "";

      // Push arrived while the app is open → refresh the bell badge + feed live.
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      toast.custom(
        (t) => (
          <div
            onClick={() => {
              toast.dismiss(t);
              if (route) router.push(route);
            }}
            className="group relative flex w-[min(400px,calc(100vw-2rem))] cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-2xl transition-all hover:scale-[1.02] hover:bg-white/90 active:scale-[0.98] dark:border-white/10 dark:bg-zinc-900/80 dark:hover:bg-zinc-900/90"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />

            <div className="absolute bottom-0 left-0 h-[3px] w-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full bg-primary transition-all duration-[6000ms] ease-linear"
                style={{
                  width: "0%",
                  animation: "progress-shrank 6s linear forwards",
                }}
              />
            </div>

            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-2 ring-primary/20">
                <IoMdNotifications size={20} />
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {title}
                </h3>
                <span className="text-[10px] font-semibold uppercase text-zinc-400">
                  Now
                </span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-zinc-600 dark:text-zinc-400">
                {body}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.dismiss(t);
              }}
              className="relative ml-2 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              <span className="text-xl leading-none text-zinc-400">&times;</span>
            </button>
          </div>
        ),
        {
          duration: 4000,
        },
      );
    });

    return () => unsubscribe();
  }, [router, queryClient]);

  return (
    <style jsx global>{`
      @keyframes progress-shrank {
        from {
          width: 100%;
        }
        to {
          width: 0%;
        }
      }
    `}</style>
  );
};

export default NotificationBar;
