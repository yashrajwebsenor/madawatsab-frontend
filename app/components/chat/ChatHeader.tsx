import useChatStore from "@/app/store/useChatStore";
import { ChatRoom } from "@/app/types/types";
import { Avatar, Button } from "@heroui/react";
import clsx from "clsx";
import Link from "next/link";
import { LuChevronLeft } from "react-icons/lu";
import routes from "@/app/configs/route-paths";
import UserActionsMenu from "@/app/components/shared/UserActionsMenu";

const ChatHeader = ({ roomId }: { roomId: string }) => {
  const { participants, roomsById, upsertRoom } = useChatStore();

  const pariticipant = participants[roomId!];
  const room = roomsById[roomId!];

  // Blocking disables messaging both ways; unblocking restores it. Keep the room
  // flags in sync so ChatFooter switches between composer / Unblock bar live.
  const handleBlockChange = (blocked: boolean) => {
    upsertRoom({
      _id: roomId,
      isBlockedByMe: blocked,
      messagingDisabled: blocked,
    } as ChatRoom);
  };

  return (
    <div className="h-[60px] px-5 w-full border-b flex justify-between items-center">
      <div className="flex items-center gap-2">
        {/* The chat list is hidden below sm; give mobile a way back to it. */}
        <Button
          as={Link}
          href={routes.message.index}
          isIconOnly
          size="sm"
          variant="light"
          radius="full"
          aria-label="Back to messages"
          className="-ml-1 sm:hidden"
        >
          <LuChevronLeft size={22} />
        </Button>
        <Avatar
          isBordered
          color="primary"
          name={pariticipant?.fullName}
          src={pariticipant?.profilePhoto?.url}
          className={clsx(
            "w-8 h-8 text-large ring-2 ring-offset-2 ring-transparent group-hover:ring-primary/20 transition-all",
            { "blur-[2px]": pariticipant?.shouldBlur ?? pariticipant?.isPrivate },
          )}
        />
        <div className="flex flex-col items-start">
          <p className="font-medium text-gray-800 text-sm">
            {pariticipant?.fullName}
          </p>
          <p className="text-xs text-gray-400">{pariticipant?.occupation}</p>
        </div>
      </div>

      {pariticipant?._id && (
        <UserActionsMenu
          userId={pariticipant._id}
          isBlockedByMe={room?.isBlockedByMe}
          onBlockChange={handleBlockChange}
        />
      )}
    </div>
  );
};

export default ChatHeader;
