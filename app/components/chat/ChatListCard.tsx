import routes from "@/app/configs/route-paths";
import socketService from "@/app/socket";
import socketEvents from "@/app/socket/socket-config";
import useChatStore from "@/app/store/useChatStore";
import useUserStore from "@/app/store/useUserStore";
import { AttachmentTypes } from "@/app/types/enum";
import { ChatRoom } from "@/app/types/types";
import { Avatar, Badge } from "@heroui/react";
import clsx from "clsx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

dayjs.extend(relativeTime);

interface ChatListCardProps extends ChatRoom {
  isPromoted?: boolean;
}

const ChatListCard = ({
  _id,
  unreadCount,
  lastMessage,
  isPromoted = false,
}: ChatListCardProps) => {
  const router = useRouter();
  const { user } = useUserStore();
  const { participants: allParticipants, markRoomRead, onlineUsers } =
    useChatStore();

  const otherUser = allParticipants?.[_id];

  const handleNavigateToChat = () => {
    router.push(routes.message.chat(_id));
    if (unreadCount > 0) {
      socketService.emit(socketEvents.EMIT.READ_MESSAGES, {
        roomId: _id,
        userId: user?._id,
      });
      markRoomRead(_id);
    }
  };

  const lastMessageText = useMemo(() => {
    if (!lastMessage?.content && !lastMessage?.attachment?.url) return "";
    if (lastMessage?.attachment?.url) {
      return lastMessage.attachment.type === AttachmentTypes.chat_image
        ? "📷 Image"
        : "📹 Video";
    }

    return lastMessage?.content;
  }, [lastMessage]);

  return (
    <motion.div
      layout="position"
      initial={false}
      animate={
        isPromoted
          ? {
              opacity: [0.65, 1],
              y: [-10, 0],
            }
          : { opacity: 1, y: 0 }
      }
      transition={{
        layout: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.22, ease: "easeOut" },
        y: { duration: 0.22, ease: "easeOut" },
      }}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
      onClick={handleNavigateToChat}
      className="cursor-pointer group"
    >
      <div className="flex items-center gap-3 px-3 py-1 rounded-2xl transition-all duration-300 hover:bg-gray-50 border border-transparent hover:border-gray-100">
        <div className="relative">
          <Badge
            content=""
            color="success"
            shape="circle"
            placement="bottom-right"
            className="border-2 border-white"
            isInvisible={!otherUser?._id || !onlineUsers?.[otherUser._id]}
          >
            <Avatar
              isBordered
              color="primary"
              name={otherUser?.fullName}
              src={otherUser?.profilePhoto?.url}
              className={clsx(
                "w-10 h-10 text-large ring-2 ring-offset-2 ring-transparent group-hover:ring-primary/20 transition-all rounded-full",
                {
                  "blur-[2px]":
                    otherUser?.shouldBlur ??
                    (otherUser?.isPrivate || otherUser?.isGalleryPrivate),
                },
              )}
            />
          </Badge>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-800 truncate text-sm">
              {otherUser?.fullName}
            </h4>
            <span
              className={clsx("text-[10px] whitespace-nowrap ml-2", {
                "text-primary font-semibold": unreadCount > 0,
                "text-gray-400": unreadCount === 0,
              })}
            >
              {dayjs(lastMessage?.createdAt).fromNow(true)}
            </span>
          </div>

          <div className="flex justify-between items-center mt-0.5">
            <p
              className={clsx("text-xs truncate flex-1", {
                "text-gray-900 font-semibold": unreadCount > 0,
                "text-gray-500 font-normal": unreadCount === 0,
              })}
            >
              {lastMessageText}
            </p>
            {unreadCount > 0 && (
              <div className="bg-primary text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 ml-2 shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatListCard;
