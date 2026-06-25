"use client";

import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import routes from "@/app/configs/route-paths";
import { NotificationUnreadCounts } from "@/app/types/types";
import { Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { IoNotificationsOutline } from "react-icons/io5";

// Bell in the header. Shows the total unread notification count, refetched on a
// timer (and invalidated live by NotificationBar when a push arrives). Shares
// the ["notifications-unread"] key with the notifications screen so opening a
// tab there clears this badge too.
const NotificationBell = ({ size = 20 }: { size?: number }) => {
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: async () =>
      (await api.get(
        ENDPOINTS.NOTIFICATIONS.UNREAD_COUNTS,
      )) as NotificationUnreadCounts,
    refetchInterval: 60_000,
  });

  const total = data?.total ?? 0;

  return (
    <Button
      isIconOnly
      variant="light"
      radius="full"
      aria-label="Notifications"
      onPress={() => router.push(routes.notifications)}
      className="relative overflow-visible"
    >
      <IoNotificationsOutline size={size} />
      {total > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-1 ring-white">
          {total > 99 ? "99+" : total}
        </span>
      )}
    </Button>
  );
};

export default NotificationBell;
