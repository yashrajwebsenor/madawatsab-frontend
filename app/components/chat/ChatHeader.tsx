import useChatStore from "@/app/store/useChatStore";
import { ChatRoom } from "@/app/types/types";
import { Avatar, Button } from "@heroui/react";
import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { LuChevronLeft } from "react-icons/lu";
import { FiSearch } from "react-icons/fi";
import routes from "@/app/configs/route-paths";
import UserActionsMenu from "@/app/components/shared/UserActionsMenu";
import ChatSearch from "@/app/components/chat/ChatSearch";
import ConfirmDialog from "@/app/components/shared/ConfirmDialog";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";

const ChatHeader = ({ roomId }: { roomId: string }) => {
  const { participants, roomsById, upsertRoom, clearMessagesInRoom } =
    useChatStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

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

  // "Clear chat" wipes the conversation from this user's view only (per-user
  // cutoff on the backend); the other participant keeps the full history.
  const handleClearChat = async () => {
    try {
      setClearing(true);
      await api.delete(ENDPOINTS.CHAT.CLEAR_CHAT(roomId));
      clearMessagesInRoom(roomId);
      setClearOpen(false);
    } catch {
      // The axios interceptor already surfaces a toast on failure.
    } finally {
      setClearing(false);
    }
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

      <div className="flex items-center gap-1">
        {/* Search this conversation's history. Hidden for a self-deleted peer. */}
        {!pariticipant?.isDeleted && (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            radius="full"
            aria-label="Search in conversation"
            onPress={() => setSearchOpen(true)}
          >
            <FiSearch size={18} />
          </Button>
        )}

        {/* No block/report actions against a self-deleted account. */}
        {pariticipant?._id && !pariticipant?.isDeleted && (
          <UserActionsMenu
            userId={pariticipant._id}
            isBlockedByMe={room?.isBlockedByMe}
            onBlockChange={handleBlockChange}
            onClearChat={() => setClearOpen(true)}
          />
        )}
      </div>

      {searchOpen && (
        <ChatSearch roomId={roomId} onClose={() => setSearchOpen(false)} />
      )}

      <ConfirmDialog
        isOpen={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={handleClearChat}
        loading={clearing}
        title="Clear chat?"
        description="This removes the conversation history from your view only. The other person will still see it."
        confirmText="Clear chat"
      />
    </div>
  );
};

export default ChatHeader;
