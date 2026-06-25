"use client";

import { useState } from "react";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import socketService from "@/app/socket";
import socketEvents from "@/app/socket/socket-config";
import useChatStore from "@/app/store/useChatStore";
import useUserStore from "@/app/store/useUserStore";
import { Message } from "@/app/types/types";
import ConfirmDialog from "@/app/components/shared/ConfirmDialog";

type Props = {
  message: Message;
  isMe: boolean;
};

// Which confirm is open. "me" hides the message for the current user only;
// "everyone" tombstones it for both via the socket.
type PendingAction = "me" | "everyone" | null;

/**
 * Per-message options menu (delete for me / delete for everyone). Reuses the
 * HeroUI Dropdown pattern from UserActionsMenu and a shared ConfirmDialog for
 * the destructive confirmation.
 */
const MessageActionsMenu = ({ message, isMe }: Props) => {
  const userId = useUserStore((s) => s.user?._id);
  const [pending, setPending] = useState<PendingAction>(null);
  const [working, setWorking] = useState(false);

  // "Delete for everyone" only makes sense on your own, not-yet-deleted message.
  const canDeleteForEveryone = isMe && !message.isDeleted;

  const handleDeleteForMe = async () => {
    try {
      setWorking(true);
      await api.delete(
        ENDPOINTS.CHAT.DELETE_MESSAGE_FOR_ME(message.roomId, message._id),
      );
      useChatStore.getState().removeMessage(message.roomId, message._id);
    } catch {
      // The axios interceptor already surfaces a toast on failure.
    } finally {
      setWorking(false);
      setPending(null);
    }
  };

  const handleDeleteForEveryone = () => {
    // Fire-and-forget over the socket; the messageDeleted broadcast (sender
    // included) is the source of truth. Update optimistically so the bubble
    // flips immediately.
    socketService.emit(socketEvents.EMIT.DELETE_MESSAGE, {
      roomId: message.roomId,
      messageId: message._id,
      senderId: userId,
    });
    useChatStore.getState().markMessageDeleted(message.roomId, message._id);
    setPending(null);
  };

  const onAction = (key: React.Key) => {
    if (key === "delete-me") setPending("me");
    if (key === "delete-everyone") setPending("everyone");
  };

  return (
    <>
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            radius="full"
            aria-label="Message actions"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-foreground/40 hover:text-foreground/80 min-w-7 w-7 h-7"
          >
            <BsThreeDotsVertical size={14} />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Message actions" onAction={onAction}>
          {[
            <DropdownItem
              key="delete-me"
              startContent={<FiTrash2 size={16} />}
            >
              Delete for me
            </DropdownItem>,
            ...(canDeleteForEveryone
              ? [
                  <DropdownItem
                    key="delete-everyone"
                    className="text-danger"
                    color="danger"
                    startContent={<FiTrash2 size={16} />}
                  >
                    Delete for everyone
                  </DropdownItem>,
                ]
              : []),
          ]}
        </DropdownMenu>
      </Dropdown>

      <ConfirmDialog
        isOpen={pending === "me"}
        onClose={() => setPending(null)}
        onConfirm={handleDeleteForMe}
        loading={working}
        title="Delete message?"
        description="This message will be removed from your view only. The other person will still see it."
        confirmText="Delete for me"
      />

      <ConfirmDialog
        isOpen={pending === "everyone"}
        onClose={() => setPending(null)}
        onConfirm={handleDeleteForEveryone}
        title="Delete for everyone?"
        description="This message will be deleted for everyone in this chat. This can't be undone."
        confirmText="Delete for everyone"
      />
    </>
  );
};

export default MessageActionsMenu;
