import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import { navigations } from "@/app/configs/data";
import routes from "@/app/configs/route-paths";
import useChatStore from "@/app/store/useChatStore";
import { ActivityUnreadCounts } from "@/app/types/types";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

type HeaderMenuProps = {
  className?: string;
  /** "header" = inline underline nav (desktop). "drawer" = stacked tappable rows. */
  variant?: "header" | "drawer";
  /** Fired after a nav item is clicked — used by the drawer to auto-close. */
  onItemClick?: () => void;
};

const HeaderMenu = ({
  className,
  variant = "header",
  onItemClick,
}: HeaderMenuProps) => {
  const pathname = usePathname();
  const isDrawer = variant === "drawer";

  // Total unread across all rooms — a primitive, so subscribing this way is
  // safe (no re-render loop). Kept live by the chat socket listener.
  const totalUnread = useChatStore((s) =>
    Object.values(s.roomsById).reduce(
      (acc, room) => acc + (room?.unreadCount || 0),
      0,
    ),
  );

  // Activity unread total — refetched (no socket). Shares the ["activity-unread"]
  // key with the Activity page, so opening a tab there clears this badge too.
  const { data: activityUnread } = useQuery({
    queryKey: ["activity-unread"],
    queryFn: async () =>
      (await api.get(ENDPOINTS.ACTIVITY.UNREAD_COUNTS)) as ActivityUnreadCounts,
    refetchInterval: 60_000,
  });
  const activityTotal = activityUnread?.total ?? 0;

  return (
    <div
      className={clsx(
        isDrawer ? "flex flex-col gap-1" : "flex items-start gap-7",
        className,
      )}
    >
      {navigations.map((item) => {
        const isActive = pathname === item.href;
        const badgeCount =
          item.href === routes.message.index
            ? totalUnread
            : item.href === routes.activity
              ? activityTotal
              : 0;

        return (
          <Link
            key={item.title}
            href={item.href}
            onClick={onItemClick}
            className={clsx(
              isDrawer
                ? clsx(
                    "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-default-700 hover:bg-default-100",
                  )
                : clsx(
                    "text-sm pb-1 hover:border-b font-medium relative inline-flex items-center gap-1.5",
                    isActive && "text-primary border-b-2 border-primary",
                  ),
            )}
          >
            <span>{item.title}</span>
            {badgeCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold leading-none min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full shadow-sm">
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default HeaderMenu;
