import { navigations } from "@/app/configs/data";
import routes from "@/app/configs/route-paths";
import useChatStore from "@/app/store/useChatStore";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const HeaderMenu = ({ className }: { className?: string }) => {
  const pathname = usePathname();

  // Total unread across all rooms — a primitive, so subscribing this way is
  // safe (no re-render loop). Kept live by the chat socket listener.
  const totalUnread = useChatStore((s) =>
    Object.values(s.roomsById).reduce(
      (acc, room) => acc + (room?.unreadCount || 0),
      0,
    ),
  );

  return (
    <div className={clsx("flex items-start gap-7", className)}>
      {navigations.map((item) => {
        const isActive = pathname === item.href;
        const showUnread =
          item.href === routes.message.index && totalUnread > 0;

        return (
          <Link
            key={item.title}
            href={item.href}
            className={clsx(
              "text-sm pb-1 hover:border-b font-medium relative inline-flex items-center gap-1.5",
              isActive && "text-primary border-b-2 border-primary",
            )}
          >
            {item.title}
            {showUnread && (
              <span className="bg-red-500 text-white text-[10px] font-bold leading-none min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full shadow-sm">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default HeaderMenu;
