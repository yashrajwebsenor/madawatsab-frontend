"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import socketService from "@/app/socket";
import socketEvents from "@/app/socket/socket-config";
import useChatStore from "@/app/store/useChatStore";
import useUserStore from "@/app/store/useUserStore";
import { ChatRoom, Message } from "@/app/types/types";

/**
 * Single global place that owns the chat socket listeners. Mounted once in the
 * (app) layout so screens never register their own newMessage / presence
 * handlers. Incoming events are routed through the store, using activeRoomId to
 * decide between "this room is open" and "bump unread for another room".
 */
const ChatSocketListener = () => {
  const userId = useUserStore((s) => s.user?._id);
  const queryClient = useQueryClient();
  const pendingRoomSummaryFetches = useRef(new Set<string>());

  useEffect(() => {
    if (!userId) return;

    const loadMissingRoomSummary = async (roomId: string) => {
      if (pendingRoomSummaryFetches.current.has(roomId)) return;
      pendingRoomSummaryFetches.current.add(roomId);

      try {
        const res: any = await api.get(ENDPOINTS.CHAT.GET_ROOM_SUMMARY(roomId));
        const room = res?.data as ChatRoom | undefined;
        if (!room?._id) throw new Error("Invalid room summary payload");

        const store = useChatStore.getState();
        store.upsertRoom(room);

        const participant = room.participants.find((p) => p._id !== userId);
        if (participant) {
          store.upsertParticipant(room._id, participant);
        }

        if (store.activeRoomId === roomId) {
          store.markRoomRead(roomId);
        }
      } catch {
        // Fallback: refresh rooms cache if targeted summary fetch fails.
        await queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
      } finally {
        pendingRoomSummaryFetches.current.delete(roomId);
      }
    };

    const unsubNewMessage = socketService.on(
      socketEvents.LISTEN.NEW_MESSAGE,
      (message: Message) => {
        if (!message?.roomId) return;
        const store = useChatStore.getState();
        const hasRoom = !!store.roomsById[message.roomId];

        store.appendMessage(message);
        store.upsertRoomFromMessage(message);
        if (!hasRoom) {
          void loadMissingRoomSummary(message.roomId);
        }

        if (message.senderId === userId) return;

        if (store.activeRoomId === message.roomId) {
          // Room is open — mark it read and tell the backend.
          store.markRoomRead(message.roomId);
          socketService.emit(socketEvents.EMIT.READ_MESSAGES, {
            roomId: message.roomId,
            userId,
          });
        } else if (hasRoom) {
          store.incrementUnread(message.roomId);
        }
      },
    );

    const unsubMessagesRead = socketService.on(
      socketEvents.LISTEN.MESSAGES_READ,
      (data: { roomId?: string; readerId?: string }) => {
        if (!data?.roomId || !data?.readerId) return;
        useChatStore
          .getState()
          .markMessagesReadInRoom(data.roomId, data.readerId);
      },
    );

    const unsubPresenceBulk = socketService.on(
      socketEvents.LISTEN.PRESENCE_BULK,
      (data: Record<string, boolean>) => {
        useChatStore.getState().setOnlineUsers(data || {});
      },
    );

    const unsubPresenceUpdate = socketService.on(
      socketEvents.LISTEN.PRESENCE_UPDATE,
      (data: { userId?: string; isOnline?: boolean }) => {
        if (!data?.userId) return;
        useChatStore.getState().updateUserPresence(data.userId, !!data.isOnline);
      },
    );

    return () => {
      unsubNewMessage();
      unsubMessagesRead();
      unsubPresenceBulk();
      unsubPresenceUpdate();
    };
  }, [queryClient, userId]);

  return null;
};

export default ChatSocketListener;
